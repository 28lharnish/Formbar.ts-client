export type ColorVisionMode = "default" | "deuteranopia" | "protanopia" | "tritanopia";

const accessiblePalettes: Record<Exclude<ColorVisionMode, "default">, string[]> = {
	deuteranopia: ["#0072B2", "#E69F00", "#56B4E9", "#D55E00", "#CC79A7", "#009E73"],
	protanopia: ["#0072B2", "#F0E442", "#56B4E9", "#D55E00", "#CC79A7", "#009E73"],
	tritanopia: ["#D55E00", "#0072B2", "#009E73", "#CC79A7", "#E69F00", "#56B4E9"],
};

export function accessiblePollColor(
	color: string | undefined,
	mode: ColorVisionMode,
	index: number,
): string | undefined {
	if (mode === "default") return color;
	return accessiblePalettes[mode][index % accessiblePalettes[mode].length];
}
