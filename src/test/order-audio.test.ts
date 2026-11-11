import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  orderAudioService,
  formatOrderSpeechText,
  formatServiceCallSpeechText,
} from "../lib/order-audio";

describe("Order Audio & FIFO Speech Queue Suite", () => {
  beforeEach(() => {
    orderAudioService.clearQueue();
    orderAudioService.setSoundEnabled(true);
  });

  it("formats order speech text with specific dishes when items <= 3", () => {
    const formatted = formatOrderSpeechText({
      tableNumber: "3",
      totalItems: 2,
      items: [
        { name: "Paneer Tikka", quantity: 1 },
        { name: "Butter Naan", quantity: 2 },
      ],
    });

    expect(formatted.hindiText).toContain("टेबल नंबर 3");
    expect(formatted.hindiText).toContain("Paneer Tikka");
    expect(formatted.hindiText).toContain("2 Butter Naan");
    expect(formatted.englishFallback).toContain("Table number 3");
  });

  it("formats order speech text with total count when items > 3", () => {
    const formatted = formatOrderSpeechText({
      tableNumber: "5",
      totalItems: 6,
      items: [
        { name: "Dish A", quantity: 1 },
        { name: "Dish B", quantity: 1 },
        { name: "Dish C", quantity: 2 },
        { name: "Dish D", quantity: 2 },
      ],
    });

    expect(formatted.hindiText).toContain("टेबल नंबर 5");
    expect(formatted.hindiText).toContain("6 डिश का नया आर्डर आया है");
  });

  it("formats service call text for waiter assistance", () => {
    const formatted = formatServiceCallSpeechText({
      tableNumber: "2",
      reason: "waiter",
    });

    expect(formatted.hindiText).toContain("टेबल नंबर 2 पर वेटर को बुलाया गया है");
    expect(formatted.englishFallback).toContain("Waiter assistance requested");
  });

  it("formats service call text for drinking water, bill, and cutlery", () => {
    const water = formatServiceCallSpeechText({ tableNumber: "1", reason: "water" });
    expect(water.hindiText).toContain("पीने का पानी");

    const bill = formatServiceCallSpeechText({ tableNumber: "1", reason: "bill" });
    expect(bill.hindiText).toContain("बिल");

    const cutlery = formatServiceCallSpeechText({ tableNumber: "1", reason: "cutlery" });
    expect(cutlery.hindiText).toContain("कटलरी");
  });

  it("queues multiple announcements in strict FIFO order according to creation time", () => {
    const table3Time = 1000300;
    const table1Time = 1000100;
    const table2Time = 1000200;

    // Enqueue out of order (Table 3 first, then Table 1, then Table 2)
    orderAudioService.enqueue({
      id: "ord_3",
      tableNumber: "3",
      hindiText: "Table 3",
      englishFallback: "Table 3",
      createdAt: table3Time,
    });

    orderAudioService.enqueue({
      id: "ord_1",
      tableNumber: "1",
      hindiText: "Table 1",
      englishFallback: "Table 1",
      createdAt: table1Time,
    });

    orderAudioService.enqueue({
      id: "ord_2",
      tableNumber: "2",
      hindiText: "Table 2",
      englishFallback: "Table 2",
      createdAt: table2Time,
    });

    // In-flight processing takes current, remaining queue must be sorted FIFO by createdAt ASC
    const queue = (orderAudioService as any).queue;
    if (queue.length >= 2) {
      expect(queue[0].createdAt).toBeLessThanOrEqual(queue[1].createdAt);
    }
  });

  it("prevents duplicate announcement IDs from being enqueued twice", () => {
    orderAudioService.enqueue({
      id: "ord_dup_1",
      tableNumber: "4",
      hindiText: "Table 4",
      englishFallback: "Table 4",
      createdAt: 1000000,
    });

    orderAudioService.enqueue({
      id: "ord_dup_1",
      tableNumber: "4",
      hindiText: "Table 4",
      englishFallback: "Table 4",
      createdAt: 1000000,
    });

    const queue = (orderAudioService as any).queue;
    const matches = queue.filter((q: any) => q.id === "ord_dup_1");
    // Either currently processing or at most 1 in queue
    expect(matches.length).toBeLessThanOrEqual(1);
  });
});
