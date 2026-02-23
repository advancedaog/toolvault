import { InventoryItem, Certificate, CheckoutRecord } from '../types';

// ─── Inventory Store ───
// In-memory data store. Arrays persist only during the session.
// Architecture supports future swap to AsyncStorage / API calls.

let items: InventoryItem[] = [];
let checkoutLog: CheckoutRecord[] = [];
let nextIdCounter = 1;

// ── ID Generation ──

function padNumber(n: number, width: number): string {
    return String(n).padStart(width, '0');
}

export function generateUniqueId(): string {
    let id: string;
    do {
        id = `INV-${padNumber(nextIdCounter, 5)}`;
        nextIdCounter++;
    } while (items.some((item) => item.id === id));
    return id;
}

// ── Items ──

export function getItems(): InventoryItem[] {
    return [...items];
}

export function getItemById(id: string): InventoryItem | undefined {
    return items.find((item) => item.id === id);
}

export function addItem(
    name: string,
    description: string,
    photoUri: string | null
): InventoryItem {
    const newItem: InventoryItem = {
        id: generateUniqueId(),
        name,
        description,
        photoUri,
        certificates: [],
        isCheckedOut: false,
        createdAt: new Date().toISOString(),
    };
    items.push(newItem);
    return newItem;
}

// ── Certificates ──

export function addCertificate(
    itemId: string,
    cert: Omit<Certificate, 'id' | 'itemId' | 'uploadedAt'>
): Certificate | null {
    const item = items.find((i) => i.id === itemId);
    if (!item) return null;

    const newCert: Certificate = {
        ...cert,
        id: `CERT-${Date.now()}`,
        itemId,
        uploadedAt: new Date().toISOString(),
    };
    item.certificates.push(newCert);
    return newCert;
}

export function getCertificatesForItem(itemId: string): Certificate[] {
    const item = items.find((i) => i.id === itemId);
    return item ? [...item.certificates] : [];
}

// ── Checkout / Checkin ──

export function checkoutItem(
    itemId: string,
    userId: string,
    userName: string,
    latitude: number | null,
    longitude: number | null
): CheckoutRecord | null {
    const item = items.find((i) => i.id === itemId);
    if (!item || item.isCheckedOut) return null;

    item.isCheckedOut = true;

    const record: CheckoutRecord = {
        id: `CHK-${Date.now()}`,
        itemId,
        userId,
        userName,
        checkoutTime: new Date().toISOString(),
        checkinTime: null,
        latitude,
        longitude,
    };
    checkoutLog.push(record);
    return record;
}

export function checkinItem(itemId: string): CheckoutRecord | null {
    const item = items.find((i) => i.id === itemId);
    if (!item || !item.isCheckedOut) return null;

    item.isCheckedOut = false;

    // Find the most recent open checkout record for this item
    const openRecord = checkoutLog
        .filter((r) => r.itemId === itemId && r.checkinTime === null)
        .sort((a, b) => new Date(b.checkoutTime).getTime() - new Date(a.checkoutTime).getTime())[0];

    if (openRecord) {
        openRecord.checkinTime = new Date().toISOString();
    }
    return openRecord || null;
}

export function getCheckoutLog(): CheckoutRecord[] {
    return [...checkoutLog];
}

export function getActiveCheckout(itemId: string): CheckoutRecord | null {
    return (
        checkoutLog.find((r) => r.itemId === itemId && r.checkinTime === null) ||
        null
    );
}
