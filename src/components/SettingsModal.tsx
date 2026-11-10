import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons"
import {
	Flex,
	Menu,
	Switch,
	type MenuProps,
	Typography,
	Slider,
	Select,
	Input,
	Button,
	Popconfirm,
	Card,
	Alert,
	Spin,
} from "antd";

const { Text } = Typography;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMobileDetect, useSettings, useUserData, useTheme } from "@/main";
import {
	settingCategories,
	settingsConfig,
	type SettingConfig,
} from "@/settings.config";
import { clearAuthTokens } from "@api/authApi";
import { socket } from "@utils/socket";
import { userHasAllScopes } from "@utils/scopeUtils";
import { getAppById } from "@api/appsApi";

type MenuItem = Required<MenuProps>["items"][number] & {
	selectedicon?: React.ReactNode;
	deselectedicon?: React.ReactNode;
};

interface SettingItemProps {
	config: SettingConfig;
	value: any;
	onChange: (newValue: any) => void;
	onAction?: (key: string) => void;
}

type AppProfile = {
	id?: number | string;
	name?: string;
	displayName?: string;
	description?: string;
	version?: string;
	author?: string;
	[key: string]: unknown;
};

export default function SettingsModal() {
	const [currentCategoryId, setCurrentCategoryId] =
		useState<string>("appearance");
	const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
		return settingCategories.map((category, index) => {
			// Handle divider
			if (category.id === "divider") {
				return {
					key: category.id,
					type: "divider",
				} as any;
			}

			return {
				key: category.id,
				icon: (
					<IonIcon
						icon={
							index === 0
								? category.selectedIcon
								: category.deselectedIcon
						}
					/>
				),
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
	const appId = settings.developer["testing-app-id"].trim();
	const [appProfile, setAppProfile] = useState<AppProfile | null>(null);
	const [appLookupLoading, setAppLookupLoading] = useState(false);
	const [appLookupError, setAppLookupError] = useState<string | null>(null);

	useEffect(() => {
		if (!appId) {
			setAppProfile(null);
			setAppLookupError(null);
			setAppLookupLoading(false);
			return;
		}

		const parsedAppId = Number(appId);
		if (!Number.isInteger(parsedAppId) || parsedAppId <= 0) {
			setAppProfile(null);
			setAppLookupError("Enter a positive numeric App ID.");
			setAppLookupLoading(false);
			return;
		}

		let isCurrentLookup = true;
		setAppLookupLoading(true);
		setAppLookupError(null);

		const lookupTimeout = window.setTimeout(() => {
			getAppById(parsedAppId)
				.then((response) => {
					if (!isCurrentLookup) return;
					const payload =
						response &&
						typeof response === "object" &&
						"data" in response
							? response.data
							: response;
					setAppProfile(
						payload && typeof payload === "object"
							? (payload as AppProfile)
							: null,
					);
					if (!payload || typeof payload !== "object") {
						setAppLookupError("The server returned an invalid app.");
					}
				})
				.catch((error: unknown) => {
					if (!isCurrentLookup) return;
					setAppProfile(null);
					setAppLookupError(
						error instanceof Error
							? error.message
							: "Unable to fetch the app.",
					);
				})
				.finally(() => {
					if (isCurrentLookup) setAppLookupLoading(false);
				});
		}, 400);

		return () => {
			isCurrentLookup = false;
			window.clearTimeout(lookupTimeout);
		};
	}, [appId]);

	function isSettingVisible(config: SettingConfig): boolean {
		// Check login requirement
		if (config.requiresLogin && !userData) {
			return false;
		}

		// Check required scopes
		if (config.requiredScopes && config.requiredScopes.length > 0) {
			if (!userData) return false;
			if (!userHasAllScopes(userData, config.requiredScopes)) {
				return false;
			}
		}

		if (config.requiresSettings) {
			const requirementMatches = config.requiresSettings.prerequisites.map(
				(prerequisite) => {
					const requiredSetting = settingsConfig.find(
						(setting) => setting.key === prerequisite.settingKey,
					);

					return (
						requiredSetting !== undefined &&
						getSettingValue(requiredSetting) === prerequisite.value
					);
				},
			);
			const requirementsMet = config.requiresSettings.requireAll
				? requirementMatches.every(Boolean)
				: requirementMatches.some(Boolean);

			if (!requirementsMet) {
				return false;
			}
		}

		return true;
	}

	function isCategoryVisible(categoryId: string): boolean {
		// Dividers are always visible
		if (categoryId === "divider") return true;

		// Check if the category has at least one visible setting
		const hasVisibleSettings = settingsConfig.some(
			(config) =>
				config.category === categoryId && isSettingVisible(config),
		);

		return hasVisibleSettings;
	}

	function handleLogout() {
		clearAuthTokens();
		socket?.disconnect();
		setUserData(null);
		navigate("/login");
	}

	function handleAction(key: string) {
		if (key === "logout") {
			handleLogout();
		}
	}

	function renderSettingItem({
		config,
		value,
		onChange,
		onAction,
	}: SettingItemProps) {
		switch (config.type) {
			case "boolean":
				return (
					<Flex
						gap={16}
						align="center"
						justify="space-between"
						style={{ width: "100%" }}
					>
						<Flex vertical gap={2} style={{ flex: 1 }}>
							<Text>
								{isMobile && config.mobileLabel
									? config.mobileLabel
									: config.label}
							</Text>
							{!isMobile && config.description && (
								<Text
									type="secondary"
									style={{ fontSize: "12px" }}
								>
									{config.description}
								</Text>
							)}
						</Flex>
						<Switch checked={value} onChange={onChange} />
					</Flex>
				);
			case "input":
				return (
					<Flex
						gap={16}
						align="center"
						justify="space-between"
						style={{ width: "100%" }}
					>
						<Flex vertical gap={2} style={{ flex: 1 }}>
							<Text>
								{isMobile && config.mobileLabel
									? config.mobileLabel
									: config.label}
							</Text>
							{!isMobile && config.description && (
								<Text
									type="secondary"
									style={{ fontSize: "12px" }}
								>
									{config.description}
								</Text>
							)}
						</Flex>
						<Input
							value={value ?? ""}
							onChange={(event) => onChange(event.target.value)}
							style={{ width: 200 }}
						/>
					</Flex>
				);
			case "number":
				return (
					<Flex vertical gap={8} style={{ width: "100%" }}>
						<Flex justify="space-between" align="center">
							<Flex vertical gap={2}>
								<Text>
									{isMobile && config.mobileLabel
										? config.mobileLabel
										: config.label}
								</Text>
								{!isMobile && config.description && (
									<Text
										type="secondary"
										style={{ fontSize: 12 }}
									>
										{config.description}
									</Text>
								)}
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
							<Text>
								{isMobile && config.mobileLabel
									? config.mobileLabel
									: config.label}
							</Text>
							{!isMobile && config.description && (
								<Text type="secondary" style={{ fontSize: 12 }}>
									{config.description}
								</Text>
							)}
						</Flex>
						<Select
							style={{ minWidth: 140 }}
							value={value}
							onChange={onChange}
							options={config.options}
							optionRender={
								config.key === "accentColor"
									? (option) => (
											<Flex align="center" gap={8}>
												<span
													style={{
														width: 14,
														height: 14,
														borderRadius: "50%",
														background: String(
															option.value,
														),
														border: "1px solid #0004",
													}}
												/>
												{option.label}
											</Flex>
										)
									: undefined
							}
							labelRender={
								config.key === "accentColor"
									? (option) => (
											<Flex align="center" gap={8}>
												<span
													style={{
														width: 12,
														height: 12,
														borderRadius: "50%",
														background: String(
															option.value,
														),
														border: "1px solid #0004",
													}}
												/>
												{option.label}
											</Flex>
										)
									: undefined
							}
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
							<Button
								type="primary"
								danger
								style={{ width: "100%" }}
							>
								{config.label}
							</Button>
						</Popconfirm>
					);
				}
				if (config.key === "visit-api-docs") {
					return (
						<Flex gap={10}>
							<Button
								type="primary"
								style={{ width: "100%" }}
								onClick={() => window.open(import.meta.env.VITE_FORMBAR_API_URL + "/docs")}
								title={import.meta.env.VITE_FORMBAR_API_URL + "/docs"}
							>
								<IonIcon icon={IonIcons.documentText} /> {"API Documentation"}
							</Button>
							<Button
								type="primary"
								style={{ width: "100%" }}
								onClick={() => window.open("https://github.com/csmith1188/Formbar.js/wiki")}
								title="https://github.com/csmith1188/Formbar.js/wiki"
							>
								<IonIcon icon={IonIcons.logoGithub} /> {"Backend Wiki"}
							</Button>
							<Button
								type="primary"
								style={{ width: "100%" }}
								onClick={() => window.open("https://github.com/csmith1188/Formbar.ts-client/wiki")}
								title="https://github.com/csmith1188/Formbar.ts-client/wiki"
							>
								<IonIcon icon={IonIcons.logoGithub} /> {"Frontend Wiki"}
							</Button>
						</Flex>
					)
				}
				return null;
			case "developer-app-profile":
				return (
					<>
						{appLookupLoading && <Spin size="small" />}
						{appLookupError && (
							<Alert
								type="error"
								showIcon
								title={appLookupError}
							/>
						)}
						{appProfile && !appLookupLoading && !appLookupError && (
							<Flex vertical gap={4}>
								<Text strong>
									{appProfile.displayName ||
										appProfile.name ||
										`App ${appProfile.id ?? appId}` }
								</Text>
								{appProfile.description && (
									<Text type="secondary">
										{appProfile.description}
									</Text>
								)}
								{(appProfile.version || appProfile.author) && (
									<Text type="secondary">
										{[
											appProfile.version &&
												`Version ${appProfile.version}`,
											appProfile.author &&
												`Author: ${appProfile.author}`,
										]
											.filter(Boolean)
											.join(" | ")}
									</Text>
								)}
							</Flex>
						)}
						{!appProfile && !appLookupLoading && !appLookupError && (
							<>
								<Text strong>
									{ "Please input an App ID"}
								</Text>
							</>
						)}
					</>
				)
			default:
				return null;
		}
	}

	function openMenu(key: string) {
		// Skip divider
		if (key === "divider" || key === currentCategoryId) return;
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
		(config) =>
			config.category === currentCategoryId && isSettingVisible(config),
	);

	const visibleMenuItems = menuItems.filter((item) => {
		if (!item || item.type === "divider") return true;
		return isCategoryVisible(item.key as string);
	});

	return (
		<Flex style={{ height: "100%" }}>
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
				className={
					settings.accessibility.disableAnimations ? "" : "animMenu"
				}
				styles={{
					itemIcon: {
						marginRight: "18px",
					},
				}}
				onClick={(e) => openMenu(e.key)}
			/>
			<Flex
				vertical
				gap={20}
				style={{
					padding: isMobile ? 16 : 28,
					width: "100%",
					height: "100%",
					overflowY: "auto",
				}}
			>
				<Flex vertical gap={4}>
					<Text strong style={{ fontSize: 24 }}>
						{
							settingCategories.find(
								(category) => category.id === currentCategoryId,
							)?.label
						}
					</Text>
					<Text type="secondary">
						{
							settingCategories.find(
								(category) => category.id === currentCategoryId,
							)?.description
						}
					</Text>
				</Flex>
				<Flex vertical gap={12} style={{ width: "100%" }}>
					{currentCategoryId === "user" && userData && (
						<Card
							size="small"
							styles={{ body: { padding: isMobile ? 14 : 18 } }}
						>
							<Flex vertical gap={4}>
								<Text strong style={{ fontSize: 16 }}>
									{userData.displayName}
								</Text>
								<Text type="secondary">
									{userData.email || "Guest account"}
								</Text>
								<Text type="secondary">
									User ID: {userData.id}
								</Text>
							</Flex>
						</Card>
					)}
					{currentCategorySettings.map((config) => (
						<Card
							key={config.key}
							size="small"
							styles={{ body: { padding: isMobile ? 14 : 18 } }}
						>
							{renderSettingItem({
								config,
								value: getSettingValue(config),
								onChange: (newValue) =>
									updateSetting(config, newValue),
								onAction: handleAction,
							})}
						</Card>
					))}
				</Flex>
			</Flex>
		</Flex>
	);
}
