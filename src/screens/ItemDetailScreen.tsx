import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Platform,
} from 'react-native';
import * as Print from 'expo-print';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { getItemById, getCertificatesForItem } from '../store/inventoryStore';
import { InventoryItem, Certificate } from '../types';
import QRCode from 'react-native-qrcode-svg';

interface Props {
    itemId: string;
    onBack: () => void;
    onAddCertificate: (itemId: string) => void;
}

export default function ItemDetailScreen({ itemId, onBack, onAddCertificate }: Props) {
    const [item, setItem] = useState<InventoryItem | undefined>(undefined);
    const [certificates, setCertificates] = useState<Certificate[]>([]);

    useEffect(() => {
        const foundItem = getItemById(itemId);
        setItem(foundItem);
        if (foundItem) {
            setCertificates(getCertificatesForItem(foundItem.id));
        }
    }, [itemId]);

    const refreshData = () => {
        const foundItem = getItemById(itemId);
        setItem(foundItem);
        if (foundItem) {
            setCertificates(getCertificatesForItem(foundItem.id));
        }
    };

    const handlePrintQR = async () => {
        if (!item) return;
        const html = `
      <html>
        <head>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: -apple-system, sans-serif; }
            .label { text-align: center; margin-top: 16px; }
            .id { font-size: 24px; font-weight: bold; }
            .name { font-size: 16px; color: #666; margin-top: 4px; }
            img { width: 200px; height: 200px; }
          </style>
        </head>
        <body>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(item.id)}" />
          <div class="label">
            <div class="id">${item.id}</div>
            <div class="name">${item.name}</div>
          </div>
        </body>
      </html>
    `;
        await Print.printAsync({ html });
    };

    if (!item) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Text style={styles.emptyText}>Item not found.</Text>
                <TouchableOpacity style={styles.backBtnLarge} onPress={onBack} activeOpacity={0.8}>
                    <Text style={styles.backBtnLargeText}>‹ Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const statusColor = (status: string) => {
        switch (status) {
            case 'Pass': return colors.success;
            case 'Fail': return colors.error;
            default: return colors.textMuted;
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                <Text style={styles.backText}>‹ Back</Text>
            </TouchableOpacity>

            {/* Item Header */}
            <View style={styles.headerCard}>
                {item.photoUri ? (
                    <Image source={{ uri: item.photoUri }} style={styles.itemPhoto} />
                ) : (
                    <View style={styles.photoPlaceholder}>
                        <Text style={styles.photoEmoji}>📦</Text>
                    </View>
                )}

                <View style={styles.idBadge}>
                    <Text style={styles.idText}>{item.id}</Text>
                </View>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.description ? (
                    <Text style={styles.itemDesc}>{item.description}</Text>
                ) : null}

                {/* Status */}
                <View style={[styles.statusBadge, item.isCheckedOut ? styles.statusOut : styles.statusIn]}>
                    <Text style={styles.statusText}>
                        {item.isCheckedOut ? '📤 Checked Out' : '📥 Available'}
                    </Text>
                </View>
            </View>

            {/* QR Code Section */}
            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>QR Code</Text>
                <View style={styles.qrContainer}>
                    <QRCode
                        value={item.id}
                        size={160}
                        color="#000"
                        backgroundColor="#fff"
                    />
                </View>
                <TouchableOpacity style={styles.printBtn} onPress={handlePrintQR} activeOpacity={0.8}>
                    <Text style={styles.printBtnText}>🖨️  Reprint QR Code</Text>
                </TouchableOpacity>
            </View>

            {/* Certificates Section */}
            <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        📜 Certificates ({certificates.length})
                    </Text>
                    <TouchableOpacity
                        style={styles.addCertBtn}
                        onPress={() => onAddCertificate(item.id)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.addCertBtnText}>+ Add</Text>
                    </TouchableOpacity>
                </View>

                {certificates.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyBoxText}>No certificates yet</Text>
                        <TouchableOpacity
                            style={styles.addFirstCertBtn}
                            onPress={() => onAddCertificate(item.id)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.addFirstCertBtnText}>Add First Certificate</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    certificates.map((cert) => (
                        <View key={cert.id} style={styles.certCard}>
                            <View style={styles.certHeader}>
                                <Text style={styles.certNo}>{cert.certificateNo}</Text>
                                <View style={[styles.certStatusBadge, { backgroundColor: statusColor(cert.status) + '22', borderColor: statusColor(cert.status) }]}>
                                    <Text style={[styles.certStatusText, { color: statusColor(cert.status) }]}>{cert.status}</Text>
                                </View>
                            </View>

                            {cert.instrumentId ? (
                                <View style={styles.certRow}>
                                    <Text style={styles.certLabel}>Instrument ID</Text>
                                    <Text style={styles.certValue}>{cert.instrumentId}</Text>
                                </View>
                            ) : null}

                            {cert.calibrationDate ? (
                                <View style={styles.certRow}>
                                    <Text style={styles.certLabel}>Calibration Date</Text>
                                    <Text style={styles.certValue}>{cert.calibrationDate}</Text>
                                </View>
                            ) : null}

                            {cert.nextDueDate ? (
                                <View style={styles.certRow}>
                                    <Text style={styles.certLabel}>Next Due</Text>
                                    <Text style={styles.certValue}>{cert.nextDueDate}</Text>
                                </View>
                            ) : null}

                            <View style={styles.certRow}>
                                <Text style={styles.certLabel}>Uploaded</Text>
                                <Text style={styles.certValue}>
                                    {new Date(cert.uploadedAt).toLocaleDateString()}
                                </Text>
                            </View>

                            {cert.fileUri ? (
                                <View style={styles.certFileRow}>
                                    <Text style={styles.certFileIcon}>📄</Text>
                                    <Text style={styles.certFileText}>PDF attached</Text>
                                </View>
                            ) : null}
                        </View>
                    ))
                )}
            </View>

            <View style={{ height: spacing.xxl }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    centered: { justifyContent: 'center', alignItems: 'center' },
    content: { padding: spacing.lg, paddingTop: spacing.xxl },
    backBtn: { marginBottom: spacing.md },
    backText: { ...typography.body, color: colors.primaryLight },
    backBtnLarge: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        marginTop: spacing.md,
    },
    backBtnLargeText: { ...typography.body, color: colors.primaryLight },
    emptyText: { ...typography.body, color: colors.textMuted },

    // Header card
    headerCard: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.md,
        ...shadows.card,
    },
    itemPhoto: {
        width: 120,
        height: 120,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
    },
    photoPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: borderRadius.md,
        backgroundColor: colors.bgElevated,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    photoEmoji: { fontSize: 48 },
    idBadge: {
        backgroundColor: colors.primaryDark,
        borderRadius: borderRadius.full,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.sm,
    },
    idText: { ...typography.bodyBold, color: colors.white, letterSpacing: 2 },
    itemName: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
    itemDesc: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
    statusBadge: {
        borderRadius: borderRadius.full,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        marginTop: spacing.md,
    },
    statusIn: { backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 1, borderColor: colors.success },
    statusOut: { backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: colors.warning },
    statusText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },

    // QR section
    sectionCard: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.md,
        ...shadows.card,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    qrContainer: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        alignSelf: 'center',
        marginBottom: spacing.md,
    },
    printBtn: {
        backgroundColor: colors.success,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        alignItems: 'center',
    },
    printBtnText: { ...typography.bodyBold, color: colors.white },

    // Certificate add button
    addCertBtn: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.full,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
    },
    addCertBtnText: { ...typography.caption, color: colors.white, fontWeight: '700' },

    // Empty state
    emptyBox: {
        backgroundColor: colors.bgElevated,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
    },
    emptyBoxText: { ...typography.body, color: colors.textMuted, marginBottom: spacing.md },
    addFirstCertBtn: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.sm,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
    },
    addFirstCertBtnText: { ...typography.caption, color: colors.white, fontWeight: '600' },

    // Certificate cards
    certCard: {
        backgroundColor: colors.bgElevated,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.sm,
    },
    certHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    certNo: { ...typography.bodyBold, color: colors.textPrimary },
    certStatusBadge: {
        borderRadius: borderRadius.full,
        paddingVertical: 2,
        paddingHorizontal: spacing.sm,
        borderWidth: 1,
    },
    certStatusText: { ...typography.small, fontWeight: '700' },
    certRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 3,
    },
    certLabel: { ...typography.caption, color: colors.textMuted },
    certValue: { ...typography.caption, color: colors.textSecondary },
    certFileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xs,
        paddingTop: spacing.xs,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    certFileIcon: { fontSize: 16, marginRight: spacing.xs },
    certFileText: { ...typography.caption, color: colors.secondaryLight },
});
