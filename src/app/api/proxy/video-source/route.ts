import { NextRequest, NextResponse } from "next/server";

import { getAuthInfoFromCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // 验证用户认证
  const authInfo = getAuthInfoFromCookie(request);
  if (!authInfo || !authInfo.username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const apiUrl = searchParams.get("url");
  const query = searchParams.get("q");
  const page = searchParams.get("page") || "1";
  const typeId = searchParams.get("type");

  if (!apiUrl) {
    return NextResponse.json({ error: "缺少API URL参数" }, { status: 400 });
  }

  try {
    // 构建完整的API URL
    // 根据查询参数决定使用哪种API调用方式
    let fullApiUrl;
    if (query === "list") {
      // 获取分类列表
      fullApiUrl = `${apiUrl}?ac=list`;
    } else if (typeId) {
      // 按分类获取视频
      fullApiUrl = `${apiUrl}?ac=videolist&t=${typeId}&pg=${page}`;
    } else if (query) {
      // 搜索视频
      fullApiUrl = `${apiUrl}?ac=videolist&wd=${query}&pg=${page}`;
    } else {
      // 直接调用根路径获取分类和视频数据，支持分页
      fullApiUrl = `${apiUrl}?pg=${page}`;
    }

    console.log("代理调用视频源API:", fullApiUrl);

    // 通过服务器端调用外部API，避免CORS问题
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

    try {
      const response = await fetch(fullApiUrl, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(
          "视频源API请求失败:",
          response.status,
          response.statusText,
        );
        return NextResponse.json(
          { error: `视频源API请求失败: ${response.status}` },
          { status: response.status },
        );
      }

      const data = await response.json();
      console.log("视频源API返回数据:", {
        code: data.code,
        msg: data.msg,
        listCount: data.list ? data.list.length : 0,
        classCount: data.class ? data.class.length : 0,
        classNames: data.class ? data.class.slice(0, 5).map((c: any) => c.type_name) : []
      });

      // 返回原始API数据
      return NextResponse.json(data);
    } catch (error: any) {
      clearTimeout(timeoutId);

      // 检查是否是超时错误
      if (error.name === "AbortError") {
        console.error("视频源API请求超时");
        return NextResponse.json(
          { error: "视频源API请求超时，请检查网络连接" },
          { status: 408 },
        );
      }

      console.error("代理调用视频源API失败:", error);
      return NextResponse.json(
        { error: `代理调用视频源API失败: ${error.message}` },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("代理调用视频源API失败:", error);
    return NextResponse.json(
      { error: "代理调用视频源API失败" },
      { status: 500 },
    );
  }
}
