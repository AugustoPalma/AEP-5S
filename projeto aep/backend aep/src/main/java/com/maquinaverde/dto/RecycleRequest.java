package com.maquinaverde.dto;

public class RecycleRequest {
    private String userId;
    private int bottles;
    private boolean printCoupon;

    // Getters e Setters
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public int getBottles() { return bottles; }
    public void setBottles(int bottles) { this.bottles = bottles; }
    public boolean isPrintCoupon() { return printCoupon; }
    public void setPrintCoupon(boolean printCoupon) { this.printCoupon = printCoupon; }
}
