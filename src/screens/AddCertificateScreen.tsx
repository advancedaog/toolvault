import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { getItems, addCertificate } from '../store/inventoryStore';
import { InventoryItem } from '../types';

interface Props {
    onBack: () => void;
}

export default function AddCertificateScreen({ onBack }: Props) {
    const items = getItems();
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [certificateNo, setCertificateNo] = useState('');
    const [instrumentId, setInstrumentId] = useState('');
    const [calibrationDate, setCalibrationDate] = useState('');
    const [nextDueDate, setNextDueDate] = useState('');
    const [status, setStatus] = useState<'Pass' | 'Fail' | 'N/A'>('Pass');
    const [fileUri, setFileUri] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });
            if (!result.canceled && result.assets[0]) {
                setFileUri(result.assets[0].uri);
                setFileName(result.assets[0].name);
            }
        } catch (err) {
            setError('Failed to pick document. Please try again.');
        }
    };

    const handleSubmit = () => {
        setError('');

        if (!selectedItem) {
            setError('Please select an inventory item first.');
            return;
        }
        if (!certificateNo.trim()) {
            setError('Please enter a certificate number.');
            return;
        }

        try {
            const cert = addCertificate(selectedItem.id, {
                certificateNo: certificateNo.trim(),
                instrumentId: instrumentId.trim(),
                calibrationDate: calibrationDate.trim(),
                nextDueDate: nextDueDate.trim(),
                status,
                fileUri,
            });

            if (cert) {
                setSuccess(true);
                setError('');
            } else {
                setError('Failed to add certificate. Item may no longer exist. Please go back and try again.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        }
    };

    const handleReset = () => {
        setSelectedItem(null);
        setCertificateNo('');
        setInstrumentId('');
        setCalibrationDate('');
        setNextDueDate('');
        setStatus('Pass');
        setFileUri(null);
        setFileName(null);
        setSuccess(false);
        setError('');
    };

    if (success) {
        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <View style={styles.successCard}>
                    <Text style={styles.successEmoji}>📜 ✅</Text>
                    <Text style={styles.successTitle}>Certificate Added!</Text>
                    <Text style={styles.successText}>
                        Certificate {certificateNo} has been linked to {selectedItem?.name} ({selectedItem?.id}).
                    </Text>
                    <TouchableOpacity style={styles.primaryBtn} onPress={handleReset} activeOpacity={0.8}>
                        <Text style={styles.primaryBtnText}>Add Another Certificate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={onBack} activeOpacity={0.8}>
                        <Text style={styles.secondaryBtnText}>Back to Admin</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                <Text style={styles.backText}>‹ Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Add Certificate</Text>
            <Text style={styles.subtitle}>Link a calibration certificate to an item</Text>

            {/* Error Banner */}
            {error ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                </View>
            ) : null}

            {/* Item Selector */}
            <Text style={styles.label}>Select Item *</Text>
            {items.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>No items yet. Add an item first.</Text>
                </View>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemScroll}>
                    {items.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.itemChip,
                                selectedItem?.id === item.id && styles.itemChipSelected,
                            ]}
                            onPress={() => { setSelectedItem(item); setError(''); }}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[
                                    styles.itemChipText,
                                    selectedItem?.id === item.id && styles.itemChipTextSelected,
                                ]}
                            >
                                {item.id}
                            </Text>
                            <Text style={styles.itemChipName} numberOfLines={1}>
                                {item.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {selectedItem && (
                <View style={styles.selectedItemBanner}>
                    <Text style={styles.selectedItemText}>
                        ✓ Selected: {selectedItem.id} — {selectedItem.name}
                    </Text>
                </View>
            )}

            {/* Certificate Form */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Certificate No *</Text>
                <TextInput
                    style={styles.input}
                    value={certificateNo}
                    onChangeText={(t) => { setCertificateNo(t); setError(''); }}
                    placeholder="e.g. 5568-1"
                    placeholderTextColor={colors.textMuted}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Instrument ID</Text>
                <TextInput
                    style={styles.input}
                    value={instrumentId}
                    onChangeText={setInstrumentId}
                    placeholder="e.g. A-1002"
                    placeholderTextColor={colors.textMuted}
                />
            </View>

            <View style={styles.row}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: spacing.sm }]}>
                    <Text style={styles.label}>Calibration Date</Text>
                    <TextInput
                        style={styles.input}
                        value={calibrationDate}
                        onChangeText={setCalibrationDate}
                        placeholder="MM/DD/YYYY"
                        placeholderTextColor={colors.textMuted}
                    />
                </View>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                    <Text style={styles.label}>Next Due Date</Text>
                    <TextInput
                        style={styles.input}
                        value={nextDueDate}
                        onChangeText={setNextDueDate}
                        placeholder="MM/DD/YYYY"
                        placeholderTextColor={colors.textMuted}
                    />
                </View>
            </View>

            {/* Status */}
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusRow}>
                {(['Pass', 'Fail', 'N/A'] as const).map((s) => (
                    <TouchableOpacity
                        key={s}
                        style={[styles.statusChip, status === s && styles.statusChipActive]}
                        onPress={() => setStatus(s)}
                        activeOpacity={0.8}
                    >
                        <Text
                            style={[styles.statusChipText, status === s && styles.statusChipTextActive]}
                        >
                            {s}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* File Upload */}
            <Text style={styles.label}>Upload Certificate (PDF)</Text>
            <TouchableOpacity style={styles.uploadBox} onPress={pickDocument} activeOpacity={0.8}>
                {fileName ? (
                    <View style={styles.fileInfo}>
                        <Text style={styles.fileEmoji}>📄</Text>
                        <Text style={styles.fileNameText} numberOfLines={1}>{fileName}</Text>
                    </View>
                ) : (
                    <>
                        <Text style={styles.uploadEmoji}>📂</Text>
                        <Text style={styles.uploadText}>Tap to select PDF</Text>
                    </>
                )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.8}>
                <Text style={styles.submitBtnText}>Add Certificate</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.lg, paddingTop: spacing.xxl, paddingBottom: spacing.xxl },
    backBtn: { marginBottom: spacing.md },
    backText: { ...typography.body, color: colors.primaryLight },
    title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.xs },
    subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
    label: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    errorBox: {
        backgroundColor: 'rgba(239,68,68,0.15)',
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.error,
    },
    errorText: { ...typography.body, color: colors.errorLight },
    selectedItemBanner: {
        backgroundColor: 'rgba(99,102,241,0.15)',
        borderRadius: borderRadius.sm,
        padding: spacing.sm,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    selectedItemText: { ...typography.caption, color: colors.primaryLight, fontWeight: '600' },
    itemScroll: { marginBottom: spacing.md },
    itemChip: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginRight: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        minWidth: 100,
        alignItems: 'center',
    },
    itemChipSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.bgElevated,
    },
    itemChipText: { ...typography.bodyBold, color: colors.textSecondary },
    itemChipTextSelected: { color: colors.primaryLight },
    itemChipName: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
    emptyBox: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        alignItems: 'center',
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    emptyText: { ...typography.body, color: colors.textMuted },
    inputContainer: { marginBottom: spacing.md },
    input: {
        backgroundColor: colors.bgInput,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        color: colors.textPrimary,
        ...typography.body,
        borderWidth: 1,
        borderColor: colors.border,
    },
    row: { flexDirection: 'row' },
    statusRow: { flexDirection: 'row', marginBottom: spacing.lg, gap: spacing.sm },
    statusChip: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.full,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    statusChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    statusChipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
    statusChipTextActive: { color: colors.white },
    uploadBox: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.border,
        borderStyle: 'dashed',
        marginBottom: spacing.lg,
    },
    uploadEmoji: { fontSize: 32, marginBottom: spacing.sm },
    uploadText: { ...typography.body, color: colors.textMuted },
    fileInfo: { flexDirection: 'row', alignItems: 'center' },
    fileEmoji: { fontSize: 24, marginRight: spacing.sm },
    fileNameText: { ...typography.body, color: colors.primaryLight, flex: 1 },
    submitBtn: {
        backgroundColor: colors.secondary,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        alignItems: 'center',
        ...shadows.button,
    },
    submitBtnText: { ...typography.bodyBold, color: colors.white },

    // Success state
    successCard: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        marginTop: spacing.xxl,
        ...shadows.card,
    },
    successEmoji: { fontSize: 48, marginBottom: spacing.sm },
    successTitle: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.sm },
    successText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
    primaryBtn: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        alignItems: 'center',
        width: '100%',
        marginBottom: spacing.sm,
    },
    primaryBtnText: { ...typography.bodyBold, color: colors.white },
    secondaryBtn: {
        backgroundColor: colors.bgElevated,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        alignItems: 'center',
        width: '100%',
        borderWidth: 1,
        borderColor: colors.border,
    },
    secondaryBtnText: { ...typography.body, color: colors.primaryLight },
});
