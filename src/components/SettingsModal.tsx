import { IonIcon } from "@ionic/react";
import {
    Flex,
    Menu,
    Switch,
    type MenuProps,
    Typography,
    Slider,
    Select,
    Button,
    Popconfirm,
    Card,
} from "antd";

const { Text } = Typography;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMobileDetect, useSettings, useUserData, useTheme } from "@/main";
import { settingCategories, settingsConfig, type SettingConfig } from "@/settings.config";
import { clearAuthTokens } from "@api/authApi";
import { socket } from "@utils/socket";
import { userHasAllScopes } from "@utils/scopeUtils";

type MenuItem = Required<MenuProps>['items'][number] & {
    selectedicon?: React.ReactNode;
    deselectedicon?: React.ReactNode;
};


interface SettingItemProps {
	config: SettingConfig;
	value: any;
	onChange: (newValue: any) => void;
	onAction?: (key: string) => void;
}



export default function SettingsModal() {
    const [currentCategoryId, setCurrentCategoryId] = useState<string>("appearance");
    const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
        return settingCategories.map((category, index) => {
            // Handle divider
            if (category.id === 'divider') {
                return {
                    key: category.id,
                    type: 'divider',
                } as any;
            }
            
            return {
                key: category.id,
                icon: <IonIcon icon={index === 0 ? category.selectedIcon : category.deselectedIcon} />,
                selectedicon: <IonIcon icon={category.selectedIcon} />,
                deselectedicon: <IonIcon icon={category.deselectedIcon} />,
                label: category.label,
            };
        });
    });
    
    const { settings, updateSettings } = useSettings();
    const { isDark, isHighContrast } = useTheme();
    const isMobile = useMobileDetect();
    const { userData, setUserData } = useUserData();
    const navigate = useNavigate();
    
    function isSettingVisible(config: SettingConfig): boolean {
        // Check login requirement
        if (config.requiresLogin && !userData) {
            return false;
        }

        // Check required scopes
        if (config.requiredScopes && config.requiredScopes.length > 0) {
            if (!userData) return false;
            return userHasAllScopes(userData, config.requiredScopes);
        }

        return true;
    }

    function isCategoryVisible(categoryId: string): boolean {
        // Dividers are always visible
        if (categoryId === 'divider') return true;

        // Check if the category has at least one visible setting
        const hasVisibleSettings = settingsConfig.some(
            (config) => config.category === categoryId && isSettingVisible(config)
        );

        return hasVisibleSettings;
    }
    
    function handleLogout() {
        clearAuthTokens();
        sessionStorage.removeItem("formbarLoginCreds");
        socket?.disconnect();
        setUserData(null);
        navigate("/login");
    }
    
    function handleAction(key: string) {
        if (key === "logout") {
            handleLogout();
        }
    }
    
    function SettingItem({ config, value, onChange, onAction }: SettingItemProps) {
        switch (config.type) {
            case "boolean":
                return (
                    <Flex gap={16} align="center" justify="space-between" style={{ width: "100%" }}>
                        <Flex vertical gap={2} style={{ flex: 1 }}>
                            <Text>{isMobile && config.mobileLabel ? config.mobileLabel : config.label}</Text>
                            {!isMobile && config.description && (
                                <Text type="secondary" style={{ fontSize: "12px" }}>
                                    {config.description}
                                </Text>
                            )}
                        </Flex>
                        <Switch checked={value} onChange={onChange} />
                    </Flex>
                );
            case "number":
                return (
                    <Flex vertical gap={8} style={{ width: "100%" }}>
                        <Flex justify="space-between" align="center">
                            <Flex vertical gap={2}>
                                <Text>{isMobile && config.mobileLabel ? config.mobileLabel : config.label}</Text>
                                {!isMobile && config.description && <Text type="secondary" style={{ fontSize: 12 }}>{config.description}</Text>}
                            </Flex>
                            <Text strong>{value}%</Text>
                        </Flex>
                        <Slider
                            value={value}
                            onChange={onChange}
                            min={config.min}
                            max={config.max}
                            step={config.step}
                        />
                    </Flex>
                );
            case "select":
                return (
                    <Flex gap={16} align="center" justify="space-between">
                        <Flex vertical gap={2} style={{ flex: 1 }}>
                            <Text>{isMobile && config.mobileLabel ? config.mobileLabel : config.label}</Text>
                            {!isMobile && config.description && <Text type="secondary" style={{ fontSize: 12 }}>{config.description}</Text>}
                        </Flex>
                        <Select
                            style={{ minWidth: 140 }}
                            value={value}
                            onChange={onChange}
                            options={config.options}
                            optionRender={config.key === "accentColor" ? (option) => (
                                <Flex align="center" gap={8}>
                                    <span style={{ width: 14, height: 14, borderRadius: "50%", background: String(option.value), border: "1px solid #0004" }} />
                                    {option.label}
                                </Flex>
                            ) : undefined}
                            labelRender={config.key === "accentColor" ? (option) => (
                                <Flex align="center" gap={8}>
                                    <span style={{ width: 12, height: 12, borderRadius: "50%", background: String(option.value), border: "1px solid #0004" }} />
                                    {option.label}
                                </Flex>
                            ) : undefined}
                        />
                    </Flex>
                );
            case "action":
                if (config.key === "logout") {
                    return (
                        <Popconfirm
                            placement="topLeft"
                            title="Log Out"
                            description="Are you sure you want to log out?"
                            onConfirm={() => onAction?.(config.key)}
                            okText="Yes"
                            cancelText="No"
                            okType="danger"
                        >
                            <Button type="primary" danger style={{ width: "100%" }}>
                                {config.label}
                            </Button>
                        </Popconfirm>
                    );
                }
                return null;
            default:
                return null;
        }
    }

    function openMenu(key: string) {
        // Skip divider
        if (key === 'divider' || key === currentCategoryId) return;
        setCurrentCategoryId(key);

        const updatedItems = menuItems.map((item) => {
            if (item?.type === "divider") return item;

            if (item && item.key === key && "icon" in item) {
                return { ...item, icon: item.selectedicon } as typeof item;
            } else if (item && "icon" in item) {
                return { ...item, icon: item.deselectedicon } as typeof item;
            }
            return item;
        });
        setMenuItems(updatedItems);
    }

    function getSettingValue(config: SettingConfig): any {
        const categoryKey = config.category as keyof typeof settings;
        const category = settings[categoryKey];
        
        if (config.key === "theme") {
            return settings.appearance.theme;
        }
        
        return (category as any)?.[config.key];
    }

    function updateSetting(config: SettingConfig, newValue: any) {
        const categoryKey = config.category as keyof typeof settings;
        
        if (config.key === "theme") {
            updateSettings({
                appearance: { ...settings.appearance, theme: newValue },
            });
            return;
        }

        updateSettings({
            [categoryKey]: {
                ...(settings[categoryKey] as any),
                [config.key]: newValue,
            },
        });
    }

    const currentCategorySettings = settingsConfig.filter(
        (config) => config.category === currentCategoryId && isSettingVisible(config)
    );

    const visibleMenuItems = menuItems.filter((item) => {
        if (!item || item.type === "divider") return true;
        return isCategoryVisible(item.key as string);
    });

    return (
        <Flex style={{ width: "100%", height: "100%" }}>
            <Menu
                defaultSelectedKeys={["appearance"]}
                mode="inline"
                items={visibleMenuItems}
                inlineCollapsed={isMobile}
                theme={isHighContrast ? "light" : isDark ? "dark" : "light"}
                style={{
                    height: "100%",
                    minWidth: isMobile ? "80px" : "250px",
                    maxWidth: isMobile ? "80px" : "250px",
                    padding: "0 10px",
                    paddingTop: "15px",
                }}
                className={settings.accessibility.disableAnimations ? "" : "animMenu"}
                styles={{
                    itemIcon: {
                        marginRight: "18px",
                    },
                }}
                onClick={(e) => openMenu(e.key)}
            />
            <Flex vertical gap={20} style={{ padding: isMobile ? 16 : 28, width: "100%", height: "100%", overflowY: "auto" }}>
                <Flex vertical gap={4}>
                    <Text strong style={{ fontSize: 24 }}>
                        {settingCategories.find((category) => category.id === currentCategoryId)?.label}
                    </Text>
                    <Text type="secondary">
                        {settingCategories.find((category) => category.id === currentCategoryId)?.description}
                    </Text>
                </Flex>
                <Flex vertical gap={12} style={{ width: "100%" }}>
                    {currentCategoryId === "user" && userData && (
                        <Card size="small" styles={{ body: { padding: isMobile ? 14 : 18 } }}>
                            <Flex vertical gap={4}>
                                <Text strong style={{ fontSize: 16 }}>{userData.displayName}</Text>
                                <Text type="secondary">{userData.email || "Guest account"}</Text>
                                <Text type="secondary">User ID: {userData.id}</Text>
                            </Flex>
                        </Card>
                    )}
                    {currentCategorySettings.map((config) => (
                        <Card key={config.key} size="small" styles={{ body: { padding: isMobile ? 14 : 18 } }}>
                            <SettingItem
                                config={config}
                                value={getSettingValue(config)}
                                onChange={(newValue) => updateSetting(config, newValue)}
                                onAction={handleAction}
                            />
                        </Card>
                    ))}
                </Flex>
            </Flex>
        </Flex>
    );
}
