import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache"; // 1. Thiếu cái này

export async function POST(request: NextRequest) {
    const secret = request.nextUrl.searchParams.get('secret');
    const tag = request.nextUrl.searchParams.get('tag');

    // Kiểm tra Secret Key
    if (secret !== process.env.SECRET_KEY) {
        return NextResponse.json(
            { message: "Invalid secret key" },
            { status: 401 }
        );
    }

    // Kiểm tra Tag
    if (!tag) {
        return NextResponse.json(
            { message: "Missing tag param" },
            { status: 400 }
        );
    }

    try {
        // 2. Thực hiện xóa cache cho tag tương ứng
        revalidateTag(tag);

        return NextResponse.json({
            revalidated: true,
            now: Date.now(),
            message: `Revalidated tag: ${tag}`
        });
    } catch (err) {
        return NextResponse.json(
            { message: "Error revalidating" },
            { status: 500 }
        );
    }
}