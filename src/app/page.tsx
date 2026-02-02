/* eslint-disable no-console,react-hooks/exhaustive-deps,@typescript-eslint/no-explicit-any */

"use client";

import { Play, Search, Video } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { SearchResult } from "@/lib/types";

import PageLayout from "@/components/PageLayout";
import VideoCard from "@/components/VideoCard";

// 获取认证信息的工具函数
function getAuthInfoFromBrowserCookie() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    // 解析 document.cookie
    const cookies = document.cookie.split(";").reduce((acc, cookie) => {
      const trimmed = cookie.trim();
      const firstEqualIndex = trimmed.indexOf("=");

      if (firstEqualIndex > 0) {
        const key = trimmed.substring(0, firstEqualIndex);
        const value = trimmed.substring(firstEqualIndex + 1);
        if (key && value) {
          acc[key] = value;
        }
      }

      return acc;
    }, {} as Record<string, string>);

    const authCookie = cookies["auth"];
    if (!authCookie) {
      return null;
    }

    // 处理可能的双重编码
    let decoded = decodeURIComponent(authCookie);

    // 如果解码后仍然包含 %，说明是双重编码，需要再次解码
    if (decoded.includes("%")) {
      decoded = decodeURIComponent(decoded);
    }

    const authData = JSON.parse(decoded);
    return authData;
  } catch (error) {
    return null;
  }
}

// 视频源数据类型
interface VideoSource {
  name: string;
  key: string;
  api: string;
  detail?: string;
  disabled?: boolean;
  from: "config" | "custom";
}

// 分类选择器选项
interface SelectorOption {
  label: string;
  value: string;
}

function VideosPageClient() {
  const searchParams = useSearchParams();
  const [videoSources, setVideoSources] = useState<VideoSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState("");
  const [featuredContent, setFeaturedContent] = useState<SearchResult[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [categories, setCategories] = useState<
    { type_id: string; type_name: string }[]
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [filteredContent, setFilteredContent] = useState<SearchResult[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);

  // 胶囊选择器相关状态
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
  }>({ left: 0, width: 0 });

  // 更新指示器位置
  const updateIndicator = () => {
    const activeIndex = videoSources.findIndex(
      (source) => source.key === selectedSource,
    );

    if (activeIndex >= 0 && buttonRefs.current[activeIndex]) {
      const activeButton = buttonRefs.current[activeIndex];
      if (activeButton) {
        const { offsetLeft, offsetWidth } = activeButton;
        setIndicatorStyle({
          left: offsetLeft,
          width: offsetWidth,
        });
      }
    }
  };

  // 直接调用视频源API获取分类和影视数据
  const fetchVideoSourceData = useCallback(
    async (page: number = 1, isLoadMore: boolean = false, typeId?: string) => {
      if (!selectedSource) return;

      setIsLoadingFeatured(true);
      try {
        // 找到选中的视频源
        const selectedVideoSource = videoSources.find(
          (source) => source.key === selectedSource,
        );
        if (!selectedVideoSource || !selectedVideoSource.api) {
          setError("未找到有效的视频源API地址");
          setIsLoadingFeatured(false);
          return;
        }

        // 通过服务器端代理调用视频源API，避免CORS问题
        // 如果有分类ID，按分类获取影片；否则获取全部影片
        let proxyUrl;
        if (typeId) {
          proxyUrl = `/api/proxy/video-source?url=${encodeURIComponent(
            selectedVideoSource.api,
          )}&type=${typeId}&page=${page}`;
        } else {
          proxyUrl = `/api/proxy/video-source?url=${encodeURIComponent(
            selectedVideoSource.api,
          )}&page=${page}`;
        }
        console.log("通过代理调用视频源API:", proxyUrl);

        const response = await fetch(proxyUrl, {
          method: "GET",
          headers: {
            Cookie: document.cookie,
          },
        });

        console.log("代理API响应状态:", response.status, response.ok);

        if (!response.ok) {
          throw new Error(
            `代理API请求失败: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();
        console.log("解析后的数据:", data);
        console.log("数据包含的字段:", Object.keys(data));

        // 检查分类信息是否存在
        if (data.class) {
          console.log("分类信息:", data.class);
        } else {
          console.log("未找到分类信息");
        }

        // 处理API返回的数据格式
        if (data.code === 1) {
          // 获取影视列表
          if (data.list && Array.isArray(data.list)) {
            // 将API数据转换为SearchResult格式
            const convertedResults = data.list.map((item: any) => ({
              id: item.vod_id?.toString() || "",
              title: item.vod_name || "",
              poster: item.vod_pic || "",
              episodes: [],
              episodes_titles: [],
              source: selectedSource,
              source_name: selectedVideoSource.name,
              class: item.vod_class || "",
              year: item.vod_year?.match(/\d{4}/)?.[0] || "unknown",
              desc: item.vod_content || "",
              type_name: item.type_name || "",
              type_id: item.type_id?.toString() || "",
              douban_id: item.vod_douban_id || 0,
            }));

            // 更新分页信息
            setCurrentPage(data.page || 1);
            setTotalPages(data.pagecount || 1);
            setHasMore((data.page || 1) < (data.pagecount || 1));

            // 如果是加载更多，追加数据；否则替换数据
            if (isLoadMore) {
              setFeaturedContent((prev) => [...prev, ...convertedResults]);
            } else {
              setFeaturedContent(convertedResults);
            }
            setError("");

            // 调试信息：检查影片数据中的分类信息
            console.log(
              "影片数据中的分类信息:",
              convertedResults.map((item: { title: string; type_id: string; type_name: string }) => ({
                title: item.title,
                type_id: item.type_id,
                type_name: item.type_name,
              })),
            );

            // 使用API返回的分类信息（只在第一次加载时设置）
            if (!isLoadMore && data.class && Array.isArray(data.class)) {
              const categoryList = data.class.map((cat: any) => ({
                type_id: cat.type_id?.toString() || "",
                type_pid: cat.type_pid?.toString() || "0",
                type_name: cat.type_name || "",
              }));
              console.log("API返回的分类列表（包含层级信息）:", categoryList);
              setCategories(categoryList);

              // 默认选择第一个一级分类
              const firstLevelCategory = categoryList.find(
                (cat) => cat.type_pid === "0",
              );
              if (firstLevelCategory && !selectedCategory) {
                setSelectedCategory(firstLevelCategory.type_id);
              }
            }
          } else {
            setFeaturedContent([]);
            setCategories([]);
          }
        } else {
          setFeaturedContent([]);
          setCategories([]);
          setError("API返回数据格式不正确");
        }
      } catch (err) {
        console.error("获取视频源数据失败:", err);
        setFeaturedContent([]);
        setError("获取视频源数据失败，请检查网络连接");
      } finally {
        setIsLoadingFeatured(false);
      }
    },
    [selectedSource, videoSources],
  );

  // 获取视频源配置
  const fetchVideoSources = useCallback(async () => {
    try {
      const authInfo = getAuthInfoFromBrowserCookie();
      if (!authInfo || !authInfo.username) {
        setError("请先登录");
        return;
      }

      const response = await fetch("/api/admin/source", {
        headers: {
          Cookie: document.cookie,
        },
      });
      if (!response.ok) {
        throw new Error("获取视频源配置失败");
      }
      const data = await response.json();

      if (data.success && data.data) {
        const sources = data.data.filter(
          (source: VideoSource) => !source.disabled,
        );
        setVideoSources(sources);

        // 默认选择第一个视频源
        if (sources.length > 0 && !selectedSource) {
          setSelectedSource(sources[0].key);
        }
      }
    } catch (err) {
      console.error("获取视频源配置失败:", err);
      setError("无法获取视频源配置");
    }
  }, [selectedSource]);

  // 搜索视频
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !selectedSource) {
      setError("请选择视频源并输入搜索关键词");
      return;
    }

    setIsLoading(true);
    setError("");
    setShowResults(false);

    try {
      const authInfo = getAuthInfoFromBrowserCookie();
      if (!authInfo || !authInfo.username) {
        setError("请先登录");
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `/api/search/one?q=${encodeURIComponent(
          searchQuery.trim(),
        )}&resourceId=${selectedSource}`,
        {
          headers: {
            Cookie: document.cookie,
          },
        },
      );
      if (!response.ok) {
        throw new Error("搜索失败");
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.results && Array.isArray(data.results)) {
        setSearchResults(data.results);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setError("未找到相关结果");
      }
    } catch (err) {
      console.error("搜索失败:", err);
      setError(err instanceof Error ? err.message : "搜索失败");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedSource]);

  // 处理视频源切换
  const handleSourceChange = (sourceKey: string) => {
    setSelectedSource(sourceKey);
    setSearchResults([]);
    setShowResults(false);
    setError("");
    // 切换视频源时重新获取视频源数据
    setFeaturedContent([]);
    setIsLoadingFeatured(true);
  };

  // 初始化获取视频源配置
  useEffect(() => {
    fetchVideoSources();
  }, [fetchVideoSources]);

  // 更新指示器位置
  useEffect(() => {
    updateIndicator();
  }, [selectedSource, videoSources]);

  // 视频源切换时获取视频源数据
  useEffect(() => {
    if (selectedSource) {
      // 重置分页状态
      setCurrentPage(1);
      setHasMore(false);
      fetchVideoSourceData(1, false);
    }
  }, [selectedSource]);

  // 分类切换时获取该分类的影片
  useEffect(() => {
    if (selectedSource && selectedCategory) {
      // 重置分页状态
      setCurrentPage(1);
      setHasMore(false);
      // 按分类获取影片
      fetchVideoSourceData(1, false, selectedCategory);
    }
  }, [selectedCategory, selectedSource]);

  // 窗口大小变化时重新计算指示器位置
  useEffect(() => {
    const handleResize = () => {
      updateIndicator();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [selectedSource]);

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const getActivePath = () => {
    const params = new URLSearchParams();
    if (selectedSource) params.set("source", selectedSource);
    if (searchQuery) params.set("q", searchQuery);

    const queryString = params.toString();
    const activePath = `/videos${queryString ? `?${queryString}` : ""}`;
    return activePath;
  };

  return (
    <PageLayout activePath={getActivePath()}>
      <div className="px-4 sm:px-10 py-4 sm:py-8 overflow-visible">
        {/* 页面标题和选择器 */}
        <div className="mb-6 sm:mb-8 space-y-4 sm:space-y-6">
          {/* 页面标题 */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2 dark:text-gray-200">
              视频搜索
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              从多个视频源搜索您想观看的内容
            </p>
          </div>

          {/* 视频源选择器 - 胶囊样式 */}
          {videoSources.length > 0 && (
            <div className="bg-white/60 dark:bg-gray-800/40 rounded-2xl p-4 sm:p-6 border border-gray-200/30 dark:border-gray-700/30 backdrop-blur-sm">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  选择视频源
                </label>

                {/* 胶囊形状的视频源选择器 */}
                <div className="relative inline-flex bg-gray-100/50 dark:bg-gray-800/50 rounded-full p-1.5 backdrop-blur-sm">
                  {/* 动态指示器 */}
                  <div
                    className="absolute top-1.5 bottom-1.5 bg-white dark:bg-gray-700 rounded-full shadow-sm transition-all duration-300 ease-out"
                    style={{
                      left: `${indicatorStyle.left}px`,
                      width: `${indicatorStyle.width}px`,
                    }}
                  />

                  <div
                    ref={containerRef}
                    className="relative flex items-center space-x-1"
                  >
                    {videoSources.map((source, index) => {
                      const isActive = selectedSource === source.key;

                      return (
                        <button
                          key={source.key}
                          ref={(el) => {
                            buttonRefs.current[index] = el;
                          }}
                          onClick={() => handleSourceChange(source.key)}
                          className={`relative flex items-center justify-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 min-w-[80px] ${
                            isActive
                              ? "text-green-700 dark:text-green-400"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                          }`}
                        >
                          <Video className="w-4 h-4 mr-2" />
                          <span>{source.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 分类选择器 */}
              {categories.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    分类
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.type_id}
                        onClick={() => setSelectedCategory(category.type_id)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          selectedCategory === category.type_id
                            ? "bg-green-500 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {category.type_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-700 dark:text-red-400 text-sm">
                    {error}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 搜索结果 */}
        {showResults && (
          <div className="max-w-[95%] mx-auto overflow-visible">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                搜索结果 ({searchResults.length})
              </h2>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                视频源:{" "}
                {videoSources.find((s) => s.key === selectedSource)?.name}
              </div>
            </div>

            <div className="justify-start grid grid-cols-3 gap-x-2 gap-y-12 px-0 sm:px-2 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:gap-x-8 sm:gap-y-20">
              {searchResults.map((item, index) => (
                <div key={`${item.title}-${index}`} className="w-full">
                  <VideoCard
                    from="search"
                    title={item.title}
                    poster={item.poster}
                    source={item.source}
                    id={item.id}
                    year={item.year}
                    episodes={item.episodes}
                    type={item.episodes.length > 1 ? "tv" : ""}
                  />
                </div>
              ))}
            </div>

            {searchResults.length === 0 && (
              <div className="text-center text-gray-500 py-8 dark:text-gray-400">
                未找到相关结果，请尝试其他关键词
              </div>
            )}
          </div>
        )}

        {/* 推荐内容 */}
        {!showResults && selectedSource && featuredContent.length > 0 && (
          <div className="max-w-[95%] mx-auto overflow-visible">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                {selectedCategory
                  ? `${
                      categories.find((c) => c.type_id === selectedCategory)
                        ?.type_name || "分类"
                    }影片`
                  : "热门推荐"}
                ({featuredContent.length})
              </h2>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                视频源:{" "}
                {videoSources.find((s) => s.key === selectedSource)?.name}
                {selectedCategory && (
                  <span className="ml-2">
                    | 分类:{" "}
                    {
                      categories.find((c) => c.type_id === selectedCategory)
                        ?.type_name
                    }
                  </span>
                )}
              </div>
            </div>

            <div className="justify-start grid grid-cols-3 gap-x-2 gap-y-12 px-0 sm:px-2 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:gap-x-8 sm:gap-y-20">
              {featuredContent.map((item, index) => (
                <div key={`${item.title}-${index}`} className="w-full">
                  <VideoCard
                    from="search"
                    title={item.title}
                    poster={item.poster}
                    source={item.source}
                    id={item.id}
                    year={item.year}
                    episodes={item.episodes}
                    type={item.episodes.length > 1 ? "tv" : ""}
                  />
                </div>
              ))}
            </div>

            {/* 加载更多按钮 */}
            {hasMore && !isLoadingFeatured && (
              <div className="mt-8 text-center">
                <button
                  onClick={() =>
                    fetchVideoSourceData(
                      currentPage + 1,
                      true,
                      selectedCategory,
                    )
                  }
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  加载更多影片 (第 {currentPage + 1} / {totalPages} 页)
                </button>
              </div>
            )}

            {/* 分页信息 */}
            {!hasMore && featuredContent.length > 0 && (
              <div className="mt-8 text-center text-gray-500 dark:text-gray-400">
                已显示全部 {featuredContent.length} 部影片
              </div>
            )}
          </div>
        )}

        {/* 加载状态 */}
        {!showResults && selectedSource && isLoadingFeatured && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
              正在加载推荐内容...
            </h3>
          </div>
        )}

        {/* 空状态 */}
        {!showResults && !error && !selectedSource && (
          <div className="text-center py-12">
            <Play className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
              选择视频源并搜索内容
            </h3>
            <p className="text-gray-500 dark:text-gray-500">
              从多个视频源中搜索您想观看的电影、电视剧等内容
            </p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

export default function VideosPage() {
  return (
    <Suspense>
      <VideosPageClient />
    </Suspense>
  );
}
