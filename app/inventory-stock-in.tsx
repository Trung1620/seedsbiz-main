// app/inventory-stock-in.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    Alert,
    ActivityIndicator,
    ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth/AuthProvider";
import * as api from "@/utils/api";
import { COLORS, FONTS, SIZES, NEUMORPHISM } from "@/utils/theme";

type SKUItem = api.Variant;

export default function InventoryStockInScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const { authReady, token, activeOrg } = useAuth();

    const [warehouses, setWarehouses] = useState<api.Warehouse[]>([]);
    const [warehouseId, setWarehouseId] = useState("");

    const [allSkus, setAllSkus] = useState<SKUItem[]>([]);
    const [q, setQ] = useState("");
    const [selected, setSelected] = useState<SKUItem | null>(null);

    const [qty, setQty] = useState("");
    const [unitCost, setUnitCost] = useState("");
    const [note, setNote] = useState("");
    const [suppliers, setSuppliers] = useState<api.Supplier[]>([]);
    const [supplierId, setSupplierId] = useState("");
    const [loading, setLoading] = useState(false);

    const canUse = authReady && !!token && !!activeOrg?.id;

    useEffect(() => {
        if (!canUse) return;

        (async () => {
            try {
                const whs = await api.listWarehouses();
                setWarehouses(whs);
                setWarehouseId(whs?.[0]?.id || "");

                const skus = await api.listVariants();
                setAllSkus(skus);

                const sups = await api.listSuppliers();
                setSuppliers(sups);
                if (sups.length > 0) setSupplierId(sups[0].id);
            } catch (e: any) {
                Alert.alert(t("inventory.inError"), e?.message || t("inventory.loadDataFailed"));
            }
        })();
    }, [canUse]);


    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return allSkus.slice(0, 60);

        return allSkus
            .filter((x) => {
                const productName = (x.productNameVi || x.productNameEn || "").toLowerCase();
                const variantName = (x.name || "").toLowerCase();
                const sku = (x.sku || "").toLowerCase();
                const size = (x.size || "").toLowerCase();
                const color = (x.color || "").toLowerCase();

                const hay = `${sku} ${productName} ${size} ${color} ${variantName}`.trim();
                return hay.includes(term);
            })
            .slice(0, 60);
    }, [q, allSkus]);

    const submit = async () => {
        if (!warehouseId) return Alert.alert(t("inventory.inNeedWarehouse"), t("inventory.inNeedWarehouseMsg"));
        if (!selected?.id) return Alert.alert(t("inventory.inNeedSku"), t("inventory.inNeedSkuMsg"));

        const qn = Number(qty);
        if (!Number.isFinite(qn) || qn <= 0) {
            return Alert.alert(t("inventory.inQtyError"), t("inventory.inQtyErrorMsg"));
        }

        setLoading(true);
        try {
            await api.createStockMove({
                warehouseId,
                type: "IN",
                supplierId: supplierId || undefined,
                note: note.trim() || t('inventory.inPrefix'),
                items: [
                    {
                        variantId: selected.id,
                        productId: selected.productId || undefined,
                        qty: qn,
                        unitCost: unitCost ? Number(unitCost) : undefined,
                    } as any, 
                ],
            });

            Alert.alert(t("inventory.inSuccess"), t("inventory.inSuccessMsg"));
            router.back();
        } catch (e: any) {
            Alert.alert(t("inventory.inError"), e?.message || t("inventory.loadDataFailed"));
        } finally {
            setLoading(false);
        }
    };

    if (!authReady) return <Center text={t("inventory.loading")} />;
    if (!token) return <Center text={t("inventory.needAuth")} />;
    if (!activeOrg?.id) return <Center text={t("inventory.needOrg")} />;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.header}>
                <Pressable style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={styles.backBtnText}>←</Text>
                </Pressable>
                <View>
                    <Text style={styles.title}>{t("inventory.inTitle")}</Text>
                    <Text style={styles.muted}>{activeOrg?.name}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>{t("inventory.inWarehouseLabel")}</Text>
                <View style={styles.pillsRow}>
                    {warehouses.map((w) => {
                        const active = w.id === warehouseId;
                        return (
                            <Pressable
                                key={w.id}
                                onPress={() => setWarehouseId(w.id)}
                                style={[
                                    styles.pill,
                                    active ? [styles.pillActive, NEUMORPHISM.button] : NEUMORPHISM.cardInner
                                ]}
                            >
                                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                                    {w.name}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>{t("inventory.supplierLabel", { defaultValue: "Nhà cung cấp" })}</Text>
                <View style={styles.pillsRow}>
                    {suppliers.map((s) => {
                        const active = s.id === supplierId;
                        return (
                            <Pressable
                                key={s.id}
                                onPress={() => setSupplierId(s.id)}
                                style={[
                                    styles.pill,
                                    active ? [styles.pillActive, NEUMORPHISM.button] : NEUMORPHISM.cardInner
                                ]}
                            >
                                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                                    {s.name}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
                {suppliers.length === 0 && <Text style={{ color: COLORS.accent, fontSize: 12, marginTop: 4 }}>* Vui lòng thêm nhà cung cấp trước</Text>}
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>{t("inventory.inSkuSearch")}</Text>
                <TextInput
                    value={q}
                    onChangeText={setQ}
                    style={[styles.input, NEUMORPHISM.cardInner]}
                    autoCapitalize="none"
                    placeholder={t("inventory.inSkuPlaceholder")}
                    placeholderTextColor={COLORS.textSecondary}
                />
            </View>

            <View style={[styles.box, NEUMORPHISM.card]}>
                <Text style={styles.boxTitle}>{t("inventory.inSkuList")}</Text>

                {filtered.length === 0 ? (
                    <Text style={styles.boxMuted}>{t("inventory.inNoSku")}</Text>
                ) : (
                    <View style={{ gap: 10 }}>
                        {filtered.map((it) => {
                            const active = selected?.id === it.id;
                            const productTitle = it.productNameVi || it.productNameEn || "—";
                            const detail = [
                                it.size ? `Size: ${it.size}` : null,
                                it.color ? `${t('common.color')}: ${it.color}` : null,
                                it.name && it.name !== "Default" && it.name.length <= 40 ? it.name : null,
                            ]
                                .filter(Boolean)
                                .join(" • ");

                            return (
                                <Pressable
                                    key={it.id}
                                    onPress={() => setSelected(it)}
                                    style={[
                                        styles.skuRow, 
                                        NEUMORPHISM.button,
                                        active ? { borderColor: COLORS.primary, borderWidth: 1, backgroundColor: COLORS.primary + '10' } : {}
                                    ]}
                                >
                                    <View style={{ flex: 1 }}>
                                       <Text style={[styles.skuSku, active && { color: COLORS.primary }]}>{it.sku}</Text>
                                       <Text
                                           style={styles.productTitle}
                                           numberOfLines={2}
                                           ellipsizeMode="tail"
                                       >
                                           {productTitle}
                                       </Text>
                                       {!!detail && (
                                           <Text
                                               style={styles.skuSub}
                                               numberOfLines={1}
                                               ellipsizeMode="tail"
                                           >
                                               {detail}
                                           </Text>
                                       )}
                                    </View>
                                    <View style={active ? styles.checkCircleActive : styles.checkCircle} />
                                </Pressable>
                            );
                        })}
                    </View>
                )}
            </View>

            <View style={[styles.box, NEUMORPHISM.cardInner]}>
                <Text style={styles.boxTitle}>{t("inventory.inSelectedSku")}</Text>
                {selected ? (
                    <View>
                        <Text style={[styles.skuSku, { color: COLORS.primary }]}>{selected.sku}</Text>

                        <Text style={styles.productTitle} numberOfLines={2}>
                            {selected.productNameVi || selected.productNameEn || "—"}
                        </Text>

                        <Text style={styles.skuSub} numberOfLines={2}>
                            {[
                                selected.size ? `Size: ${selected.size}` : null,
                                selected.color ? `${t('common.color')}: ${selected.color}` : null,
                                selected.name && selected.name !== "Default" ? selected.name : null,
                            ]
                                .filter(Boolean)
                                .join(" • ") || "—"}
                        </Text>
                    </View>
                ) : (
                    <Text style={styles.boxMuted}>{t("inventory.inNoSelectedSku")}</Text>
                )}
            </View>

            <View style={styles.section}>
               <Text style={styles.label}>{t("inventory.inQtyLabel")}</Text>
               <TextInput
                   value={qty}
                   onChangeText={setQty}
                   style={[styles.input, NEUMORPHISM.cardInner]}
                   keyboardType="numeric"
                   placeholder="10"
                   placeholderTextColor={COLORS.textSecondary}
               />
            </View>

            <View style={styles.section}>
               <Text style={styles.label}>{t("inventory.inCostLabel")}</Text>
               <TextInput
                   value={unitCost}
                   onChangeText={setUnitCost}
                   style={[styles.input, NEUMORPHISM.cardInner]}
                   keyboardType="numeric"
                   placeholder="150000"
                   placeholderTextColor={COLORS.textSecondary}
               />
            </View>

            <View style={styles.section}>
               <Text style={styles.label}>{t("inventory.inNoteLabel")}</Text>
               <TextInput
                   value={note}
                   onChangeText={setNote}
                   style={[styles.input, NEUMORPHISM.cardInner]}
                   placeholder={t("inventory.inNotePlaceholder")}
                   placeholderTextColor={COLORS.textSecondary}
               />
            </View>

            <Pressable style={[styles.primaryBtn, NEUMORPHISM.button, loading && { opacity: 0.7 }]} onPress={submit} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                ) : (
                    <Text style={styles.primaryText}>{t("inventory.inConfirmBtn")}</Text>
                )}
            </Pressable>

            <Text style={styles.tipText}>
                {t("inventory.inTip")}
            </Text>
        </ScrollView>
    );
}

function Center({ text }: { text: string }) {
    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center", gap: 12 }}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={{ color: COLORS.textSecondary, fontFamily: FONTS.semiBold, fontSize: SIZES.font }}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    
    header: { flexDirection: "row", alignItems: "center", marginBottom: 20, paddingTop: 10, gap: 12 },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.background,
    },
    backBtnText: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.text },

    title: { fontSize: SIZES.extraLarge, fontFamily: FONTS.bold, color: COLORS.text },
    muted: { color: COLORS.textSecondary, fontFamily: FONTS.medium, fontSize: SIZES.small, marginTop: 2 },

    section: { marginBottom: 16 },

    label: { marginBottom: 8, fontSize: SIZES.font, fontFamily: FONTS.bold, color: COLORS.text },

    pillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 0,
    },
    pillActive: { 
       backgroundColor: COLORS.primary 
    },
    pillText: { color: COLORS.textSecondary, fontFamily: FONTS.bold, fontSize: SIZES.small },
    pillTextActive: { color: COLORS.white },

    input: {
        borderWidth: 0,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontFamily: FONTS.regular,
        fontSize: SIZES.font,
        color: COLORS.text,
    },

    box: {
        marginBottom: 16,
        borderRadius: 16,
        padding: 18,
        borderWidth: 0,
    },
    boxTitle: { fontFamily: FONTS.bold, fontSize: SIZES.font, color: COLORS.text, marginBottom: 12 },
    boxMuted: { color: COLORS.textSecondary, fontFamily: FONTS.medium, fontSize: SIZES.small },

    skuRow: {
        flexDirection: 'row',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 14,
        borderWidth: 0,
        alignItems: 'center',
    },
    
    checkCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.textSecondary + '40',
        backgroundColor: COLORS.background,
    },
    checkCircleActive: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 6,
        borderColor: COLORS.primary,
        backgroundColor: COLORS.white,
    },

    skuSku: { fontFamily: FONTS.bold, color: COLORS.text, fontSize: SIZES.small },

    productTitle: {
        marginTop: 4,
        fontFamily: FONTS.bold,
        color: COLORS.text,
        fontSize: SIZES.font,
    },

    skuSub: { marginTop: 4, color: COLORS.textSecondary, fontFamily: FONTS.medium, fontSize: SIZES.small },

    primaryBtn: {
        marginTop: 10,
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
    },
    primaryText: { color: COLORS.white, fontFamily: FONTS.bold, fontSize: SIZES.font },
    
    tipText: { 
       color: COLORS.textSecondary, 
       fontFamily: FONTS.regular, 
       fontSize: SIZES.small, 
       marginTop: 16, 
       textAlign: 'center',
       lineHeight: 20
    },
});
