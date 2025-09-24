// app/api/price/update/route.js
import { NextResponse } from "next/server";
import { setCurrentPrice, savePriceToStorage } from '@/lib/priceManager';

export async function POST(request) {
  try {
    const { pricePerKg } = await request.json();

    if (!pricePerKg || pricePerKg <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid price is required" },
        { status: 400 }
      );
    }

    // Update the server-side price
    const newPrice = setCurrentPrice(pricePerKg);
    
    // Optional: Save to persistent storage
    await savePriceToStorage(newPrice);

    return NextResponse.json({
      success: true,
      message: "Price updated successfully",
      pricePerKg: newPrice
    });

  } catch (error) {
    console.error("Price update error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update price" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { getCurrentPrice } = await import('@/lib/priceManager');
    const currentPrice = getCurrentPrice();
    
    return NextResponse.json({
      success: true,
      pricePerKg: currentPrice
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, pricePerKg: 1500 },
      { status: 500 }
    );
  }
}