import * as IonIcons from "ionicons/icons";
import type { ScopeKey } from "@/types";
import type { ColorVisionMode } from "@utils/accessibilityColors";

export type SettingType = 
	"boolean" |
	"number" |
	"select" |
	"action" |
	"input" |
	"developer-app-profile";

export interface SettingConfig {
	key: string;
	label: string;
	mobileLabel?: string;
	description?: string;
	type: SettingType;
	category: string;
	options?: { label: string; value: any }[];
	min?: number;
	max?: number;
	step?: number;
	requiresLogin?: boolean;
	requiredScopes?: ScopeKey[];
	requiresSettings?: {
		requireAll?: boolean;
		disableOnNotMet?: boolean;
		prerequisites: {
			settingKey: string;
			value: any;
		}[]
	};
}

export interface SettingCategory {
	id: string;
	label: string;
	description: string;
	icon: any;
	selectedIcon: any;
	deselectedIcon: any;
}

export const settingCategories: SettingCategory[] = [
	{
		id: "general",
		label: "General",
		description:
			"Manage sound effects and other everyday Formbar preferences.",
		icon: IonIcons.settingsOutline,
		selectedIcon: IonIcons.settings,
		deselectedIcon: IonIcons.settingsOutline,
	},
	{
		id: "appearance",
		label: "Appearance",
		description:
			"Personalize the theme and colors used throughout Formbar.",
		icon: IonIcons.colorPaletteOutline,
		selectedIcon: IonIcons.colorPalette,
		deselectedIcon: IonIcons.colorPaletteOutline,
	},
	{
		id: "accessibility",
		label: "Accessibility",
		description:
			"Make Formbar easier to read and ensure colors remain distinguishable.",
		icon: IonIcons.accessibility,
		selectedIcon: IonIcons.accessibility,
		deselectedIcon: IonIcons.accessibilityOutline,
	},
	{
		id: "divider",
		label: "",
		description: "",
		icon: null,
		selectedIcon: null,
		deselectedIcon: null,
	},
	{
		id: "developer",
		label: "Developer",
		description: "Options for App Developers",
		icon: IonIcons.codeSlash,
		selectedIcon: IonIcons.codeSlash,
		deselectedIcon: IonIcons.code,
	},
	{
		id: "user",
		label: "User",
		description: "Manage your current Formbar session.",
		icon: IonIcons.personOutline,
		selectedIcon: IonIcons.person,
		deselectedIcon: IonIcons.personOutline,
	},
];

export const settingsConfig: SettingConfig[] = [
	{
		key: "sfxVolume",
		label: "Sound Effects Volume",
		mobileLabel: "SFX",
		type: "number",
		category: "general",
		description:
			"Adjust the volume of alerts and other Formbar sound effects.",
		min: 0,
		max: 100,
		step: 1,
	},
	{
		key: "muteSfx",
		label: "Mute Sound Effects",
		type: "boolean",
		category: "general",
		description: "Silences class alerts and other app sounds",
	},
	{
		key: "theme",
		label: "Theme",
		description: "Choose between the light and dark interface themes.",
		type: "select",
		category: "appearance",
		options: [
			{ label: "Light", value: "light" },
			{ label: "Dark", value: "dark" },
		],
	},
	{
		key: "accentColor",
		label: "Accent Color",
		description:
			"Choose the color used for primary controls and highlights.",
		type: "select",
		category: "appearance",
		options: [
			{ label: "Blue", value: "#1677ff" },
			{ label: "Teal", value: "#009e9a" },
			{ label: "Orange", value: "#d97706" },
			{ label: "Violet", value: "#7c3aed" },
			{ label: "Rose", value: "#e11d48" },
		],
	},
	{
		key: "disableAnimations",
		label: "Disable Animations",
		type: "boolean",
		category: "accessibility",
		description: "Reduces motion and animations throughout the app",
	},
	{
		key: "largeText",
		label: "Larger Text",
		type: "number",
		category: "accessibility",
		description: "Adjust the base text size across the app.",
		min: 100,
		max: 150,
		step: 5,
	},
	{
		key: "highContrast",
		label: "High Contrast",
		type: "boolean",
		category: "accessibility",
		description:
			"Strengthens text, borders, and control edges for easier viewing",
	},
	{
		key: "colorVisionMode",
		label: "Color Vision Mode",
		description:
			"Uses a colorblind-friendly palette for poll answers and charts.",
		type: "select",
		category: "accessibility",
		options: [
			{
				label: "Default colors",
				value: "default" satisfies ColorVisionMode,
			},
			{
				label: "Deuteranopia",
				value: "deuteranopia" satisfies ColorVisionMode,
			},
			{
				label: "Protanopia",
				value: "protanopia" satisfies ColorVisionMode,
			},
			{
				label: "Tritanopia",
				value: "tritanopia" satisfies ColorVisionMode,
			},
		],
	},
	{
		key: "show-developer-options",
		label: "Enable Developer Options",
		description: "Shows options for developers for ease of testing apps.",
		type: "boolean",
		category: "developer",
	},
	{
		key: "visit-api-docs",
		label: "API Documentation",
		description: "Visit the page for API documentation.",
		type: "action",
		category: "developer",
		requiresSettings: {
			requireAll: true,
			prerequisites: [{
				settingKey: "show-developer-options",
				value: true,
			}],
		},
	},
	{
		key: "testing-app-id",
		label: "App ID",
		description: "App testing requires the app ID.",
		type: "input",
		category: "developer",
		requiresSettings: {
			requireAll: true,
			disableOnNotMet: false,
			prerequisites: [{
				settingKey: "show-developer-options",
				value: true,
			}],
		},
	},
	{
		key: "developer-app-profile",
		label: '',
		type: 'developer-app-profile',
		category: 'developer',
		requiresSettings: {
			requireAll: true,
			disableOnNotMet: false,
			prerequisites: [{
				settingKey: "show-developer-options",
				value: true,
			}],
		},
	},
	{
		key: "logout",
		label: "Log Out",
		description: "Sign out of your current Formbar account on this device.",
		type: "action",
		category: "user",
		requiresLogin: true,
	},
];