import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Platform,
    TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as Location from 'expo-location';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import {
    getItemById,
    checkoutItem,
    checkinItem,
    getActiveCheckout,
} from '../store/inventoryStore';
import { getCurrentUser } from '../store/authStore';
import { InventoryItem, CheckoutRecord } from '../types';

const isWeb = Platform.OS === 'web';

export default function ScanScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanning, setScanning] = useState(false);
    const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
    const [activeCheckout, setActiveCheckout] = useState<CheckoutRecord | null>(null);
    const [actionDone, setActionDone] = useState<'checkedOut' | 'checkedIn' | null>(null);
    const [actionRecord, setActionRecord] = useState<CheckoutRecord | null>(null);
    const [error, setError] = useState('');
    // Manual ID entry for web testing
    const [manualId, setManualId] = useState('');

    const startScan = async () => {
        if (isWeb) {
            // Camera doesn't work on web, skip to manual entry
            return;
        }
        if (!permission?.granted) {
            const result = await requestPermission();
            if (!result.granted) {
                setError('Camera access is required to scan QR codes.');
                return;
            }
        }
        resetState();
        setScanning(true);
    };

    const resetState = () => {
        setScannedItem(null);
        setActiveCheckout(null);
        setActionDone(null);
        setActionRecord(null);
        setError('');
        setManualId('');
    };

    const lookupItem = (itemId: string) => {
        const item = getItemById(itemId);
        if (!item) {
            setError(`No item found with ID: ${itemId}`);
            setScannedItem(null);
            return;
        }
        setError('');
        setScannedItem(item);
        const checkout = getActiveCheckout(item.id);
        setActiveCheckout(checkout);
    };

    const handleBarCodeScanned = (result: BarcodeScanningResult) => {
        setScanning(false);
        lookupItem(result.data);
    };

    const handleManualLookup = () => {
        const id = manualId.trim().toUpperCase();
        if (!id) {
            setError('Please enter an item ID.');
            return;
        }
        lookupItem(id);
    };

    const handleCheckout = async () => {
        if (!scannedItem) return;
        const user = getCurrentUser();
        if (!user) {
            setError('You must be signed in.');
            return;
        }

        // Get geolocation
        let latitude: number | null = null;
        let longitude: number | null = null;
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                latitude = loc.coords.latitude;
                longitude = loc.coords.longitude;
            }
        } catch (e) {
            // Location not available — continue without it
        }

        const record = checkoutItem(scannedItem.id, user.id, user.name, latitude, longitude);
        if (record) {
            setActionDone('checkedOut');
            setActionRecord(record);
            const updated = getItemById(scannedItem.id);
            if (updated) setScannedItem(updated);
            setActiveCheckout(record);
        } else {
            setError('Item is already checked out.');
        }
    };

    const handleCheckin = () => {
        if (!scannedItem) return;
        const record = checkinItem(scannedItem.id);
        if (record) {
            setActionDone('checkedIn');
            setActionRecord(record);
            const updated = getItemById(scannedItem.id);
            if (updated) setScannedItem(updated);
            setActiveCheckout(null);
        } else {
            setError('Item is not checked out.');
        }
    };

    // ── Scanning View (native only) ──
    if (scanning && !isWeb) {
        return (
            <View style={styles.container}>
                <CameraView
                    style={styles.camera}
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    onBarcodeScanned={handleBarCodeScanned}
                >
                    <View style={styles.cameraOverlay}>
                        <View style={styles.scanFrame}>
                            <View style={[styles.corner, styles.cornerTL]} />
                            <View style={[styles.corner, styles.cornerTR]} />
                            <View style={[styles.corner, styles.cornerBL]} />
                            <View style={[styles.corner, styles.cornerBR]} />
                        </View>
                        <Text style={styles.scanText}>Point at QR code</Text>
                        <TouchableOpacity
                            style={styles.cancelScanBtn}
                            onPress={() => setScanning(false)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.cancelScanText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </CameraView>
            </View>
        );
    }

    // ── Action Done State ──
    if (actionDone) {
        const isOut = actionDone === 'checkedOut';
        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <View style={styles.resultCard}>
                    <Text style={styles.resultEmoji}>{isOut ? '📤' : '📥'}</Text>
                    <Text style={styles.resultTitle}>
                        {isOut ? 'Checked Out!' : 'Checked In!'}
                    </Text>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Item</Text>
                        <Text style={styles.detailValue}>{scannedItem?.id} — {scannedItem?.name}</Text>
                    </View>

                    {actionRecord && (
                        <>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>{isOut ? 'Checked out by' : 'Returned by'}</Text>
                                <Text style={styles.detailValue}>{actionRecord.userName}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Time</Text>
                                <Text style={styles.detailValue}>
                                    {new Date(isOut ? actionRecord.checkoutTime : actionRecord.checkinTime!).toLocaleString()}
                                </Text>
                            </View>
                            {isOut && actionRecord.latitude && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Location</Text>
                                    <Text style={styles.detailValue}>
                                        {actionRecord.latitude.toFixed(4)}, {actionRecord.longitude?.toFixed(4)}
                                    </Text>
                                </View>
                            )}
                        </>
                    )}

                    <TouchableOpacity style={styles.scanAgainBtn} onPress={() => { resetState(); }} activeOpacity={0.8}>
                        <Text style={styles.scanAgainText}>📷 Scan Another</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    }

    // ── Scanned Item Details ──
    if (scannedItem) {
        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <View style={styles.itemCard}>
                    {scannedItem.photoUri ? (
                        <Image source={{ uri: scannedItem.photoUri }} style={styles.itemPhoto} />
                    ) : (
                        <View style={styles.itemPhotoPlaceholder}>
                            <Text style={styles.photoPlaceholderEmoji}>📦</Text>
                        </View>
                    )}

                    <View style={styles.idBadge}>
                        <Text style={styles.idText}>{scannedItem.id}</Text>
                    </View>

                    <Text style={styles.itemName}>{scannedItem.name}</Text>
                    {scannedItem.description ? (
                        <Text style={styles.itemDesc}>{scannedItem.description}</Text>
                    ) : null}

                    {/* Status */}
                    <View
                        style={[
                            styles.statusBadge,
                            scannedItem.isCheckedOut ? styles.statusOut : styles.statusIn,
                        ]}
                    >
                        <Text style={styles.statusText}>
                            {scannedItem.isCheckedOut ? '📤 Checked Out' : '📥 Available'}
                        </Text>
                    </View>

                    {/* Active checkout info */}
                    {activeCheckout && (
                        <View style={styles.checkoutInfo}>
                            <Text style={styles.checkoutInfoLabel}>Checked out by</Text>
                            <Text style={styles.checkoutInfoValue}>{activeCheckout.userName}</Text>
                            <Text style={styles.checkoutInfoLabel}>Since</Text>
                            <Text style={styles.checkoutInfoValue}>
                                {new Date(activeCheckout.checkoutTime).toLocaleString()}
                            </Text>
                        </View>
                    )}

                    {/* Certificates */}
                    {scannedItem.certificates.length > 0 && (
                        <View style={styles.certSection}>
                            <Text style={styles.certSectionTitle}>
                                📜 Certificates ({scannedItem.certificates.length})
                            </Text>
                            {scannedItem.certificates.map((cert) => (
                                <View key={cert.id} style={styles.certCard}>
                                    <View style={styles.certHeader}>
                                        <Text style={styles.certNo}>{cert.certificateNo}</Text>
                                        <View style={[
                                            styles.certStatusBadge,
                                            {
                                                backgroundColor: (cert.status === 'Pass' ? colors.success : cert.status === 'Fail' ? colors.error : colors.textMuted) + '22',
                                                borderColor: cert.status === 'Pass' ? colors.success : cert.status === 'Fail' ? colors.error : colors.textMuted,
                                            },
                                        ]}>
                                            <Text style={[
                                                styles.certStatusText,
                                                { color: cert.status === 'Pass' ? colors.success : cert.status === 'Fail' ? colors.error : colors.textMuted },
                                            ]}>{cert.status}</Text>
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
                                            <Text style={styles.certLabel}>Calibration</Text>
                                            <Text style={styles.certValue}>{cert.calibrationDate}</Text>
                                        </View>
                                    ) : null}
                                    {cert.nextDueDate ? (
                                        <View style={styles.certRow}>
                                            <Text style={styles.certLabel}>Next Due</Text>
                                            <Text style={styles.certValue}>{cert.nextDueDate}</Text>
                                        </View>
                                    ) : null}
                                    {cert.fileUri ? (
                                        <View style={styles.certFileRow}>
                                            <Text style={styles.certFileIcon}>📄</Text>
                                            <Text style={styles.certFileText}>PDF attached</Text>
                                        </View>
                                    ) : null}
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Error */}
                    {error ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>⚠️ {error}</Text>
                        </View>
                    ) : null}

                    {/* Action Buttons */}
                    {scannedItem.isCheckedOut ? (
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.checkinBtn]}
                            onPress={handleCheckin}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.actionBtnText}>📥 Check In / Return</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.checkoutBtn]}
                            onPress={handleCheckout}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.actionBtnText}>📤 Check Out</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.scanAgainBtn} onPress={() => { resetState(); }} activeOpacity={0.8}>
                        <Text style={styles.scanAgainText}>📷 Scan Another</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    }

    // ── Default: Ready to Scan ──
    return (
        <View style={[styles.container, styles.centered]}>
            <View style={styles.readyCard}>
                <Text style={styles.readyEmoji}>📱</Text>
                <Text style={styles.readyTitle}>Ready to Scan</Text>
                <Text style={styles.readySubtitle}>
                    {isWeb
                        ? 'Enter an item ID below to look it up, or use Expo Go on your phone to scan QR codes'
                        : 'Scan a QR code to check items in or out'}
                </Text>

                {/* Manual ID entry (always shown on web, optional on native) */}
                <View style={styles.manualEntry}>
                    <TextInput
                        style={styles.manualInput}
                        value={manualId}
                        onChangeText={(t) => { setManualId(t); setError(''); }}
                        placeholder="Enter Item ID (e.g. INV-00001)"
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize="characters"
                    />
                    <TouchableOpacity style={styles.lookupBtn} onPress={handleManualLookup} activeOpacity={0.8}>
                        <Text style={styles.lookupBtnText}>Look Up</Text>
                    </TouchableOpacity>
                </View>

                {error ? (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>⚠️ {error}</Text>
                    </View>
                ) : null}

                {!isWeb && (
                    <TouchableOpacity style={styles.bigScanBtn} onPress={startScan} activeOpacity={0.8}>
                        <Text style={styles.bigScanText}>📷 Open Scanner</Text>
                    </TouchableOpacity>
                )}

                {isWeb && (
                    <View style={styles.webHint}>
                        <Text style={styles.webHintText}>
                            💡 Camera scanning works on physical devices via Expo Go.{'\n'}
                            Use the ID entry above to test on web.
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    centered: { justifyContent: 'center', alignItems: 'center' },
    content: { padding: spacing.lg, paddingTop: spacing.xxl },

    // Camera
    camera: { flex: 1 },
    cameraOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: {
        width: 250,
        height: 250,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: colors.primary,
    },
    cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
    cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
    cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
    cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },
    scanText: { ...typography.body, color: colors.white, marginTop: spacing.lg },
    cancelScanBtn: {
        marginTop: spacing.xl,
        backgroundColor: colors.overlay,
        borderRadius: borderRadius.full,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.xl,
    },
    cancelScanText: { ...typography.body, color: colors.white },

    // Ready state
    readyCard: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        marginHorizontal: spacing.lg,
        maxWidth: 500,
        width: '100%',
        ...shadows.card,
    },
    readyEmoji: { fontSize: 56, marginBottom: spacing.md },
    readyTitle: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.xs },
    readySubtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },

    // Manual entry
    manualEntry: {
        width: '100%',
        marginBottom: spacing.md,
    },
    manualInput: {
        backgroundColor: colors.bgInput,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        color: colors.textPrimary,
        ...typography.body,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    lookupBtn: {
        backgroundColor: colors.secondary,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        alignItems: 'center',
    },
    lookupBtnText: { ...typography.bodyBold, color: colors.white },

    errorBox: {
        backgroundColor: 'rgba(239,68,68,0.15)',
        borderRadius: borderRadius.sm,
        padding: spacing.sm,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.error,
        width: '100%',
    },
    errorText: { ...typography.caption, color: colors.errorLight, textAlign: 'center' },

    webHint: {
        backgroundColor: 'rgba(6,182,212,0.1)',
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.secondary,
        width: '100%',
    },
    webHintText: { ...typography.caption, color: colors.secondaryLight, textAlign: 'center', lineHeight: 20 },

    bigScanBtn: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.md,
        ...shadows.button,
    },
    bigScanText: { ...typography.h3, color: colors.white },

    // Scanned Item
    itemCard: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.card,
    },
    itemPhoto: {
        width: 140,
        height: 140,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
    },
    itemPhotoPlaceholder: {
        width: 140,
        height: 140,
        borderRadius: borderRadius.md,
        backgroundColor: colors.bgElevated,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    photoPlaceholderEmoji: { fontSize: 48 },
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
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        marginVertical: spacing.md,
    },
    statusIn: { backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 1, borderColor: colors.success },
    statusOut: { backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: colors.warning },
    statusText: { ...typography.bodyBold, color: colors.textPrimary },
    checkoutInfo: {
        backgroundColor: colors.bgElevated,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        width: '100%',
        marginBottom: spacing.md,
    },
    checkoutInfoLabel: { ...typography.caption, color: colors.textMuted },
    checkoutInfoValue: { ...typography.body, color: colors.textPrimary, marginBottom: spacing.sm },
    certSection: {
        width: '100%',
        marginBottom: spacing.md,
    },
    certSectionTitle: {
        ...typography.bodyBold,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
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
        marginBottom: spacing.xs,
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
        paddingVertical: 2,
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
    certFileIcon: { fontSize: 14, marginRight: spacing.xs },
    certFileText: { ...typography.caption, color: colors.secondaryLight },
    actionBtn: {
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        alignItems: 'center',
        width: '100%',
        marginBottom: spacing.sm,
    },
    checkoutBtn: { backgroundColor: colors.warning },
    checkinBtn: { backgroundColor: colors.success },
    actionBtnText: { ...typography.bodyBold, color: colors.white },
    scanAgainBtn: {
        backgroundColor: colors.bgElevated,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        alignItems: 'center',
        width: '100%',
        borderWidth: 1,
        borderColor: colors.border,
    },
    scanAgainText: { ...typography.body, color: colors.primaryLight },

    // Result state
    resultCard: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.card,
    },
    resultEmoji: { fontSize: 48, marginBottom: spacing.sm },
    resultTitle: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.lg },
    detailRow: {
        width: '100%',
        backgroundColor: colors.bgElevated,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    detailLabel: { ...typography.caption, color: colors.textMuted },
    detailValue: { ...typography.body, color: colors.textPrimary, marginTop: 2 },
});
