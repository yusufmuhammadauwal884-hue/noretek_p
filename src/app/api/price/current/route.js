import { NextResponse } from "next/server";

export async function GET() {
  try {
    // You could store this in a database or use a different persistence method
    const currentPrice = process.env.CURRENT_PRICE_PER_KG || 1500;
    
    return NextResponse.json({
      success: true,
      pricePerKg: Number(currentPrice)
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      pricePerKg: 1500
    });
  }
}