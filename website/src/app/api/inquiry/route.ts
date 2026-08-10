import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { name, phone, company, product, message } = data;

    if (!name || !phone) {
      return NextResponse.json({ ok: false, message: "请填写姓名和电话。" }, { status: 400 });
    }

    // In production, this would send an email or save to database
    console.log("New inquiry:", { name, phone, company, product, message });

    return NextResponse.json({
      ok: true,
      message: "已收到您的需求，我们会尽快联系您。",
    });
  } catch {
    return NextResponse.json({ ok: false, message: "提交失败，请稍后重试。" }, { status: 400 });
  }
}
