import { Progress } from "antd";
import type { Poll } from "@/types";
import { useSettings, useTheme } from "@/main";
import { useEffect, useRef, useState } from "react";
import { formatTime, textColorForBackground } from "@utils/GlobalFunctions";
import { accessiblePollColor } from "@utils/accessibilityColors";

type PollObjectProperties = {
	poll: Poll;
	size?: number;
	timer?: {
		active: boolean;
		current: number;
		duration: number;
		remainingSeconds: number;
	};
	onlyTimer?: boolean;
};

type CircularPollCanvasProperties = {
	segments: { percentage: number; offset: number }[];
	colors: string[];
	size: number;
	strokeWidth: number;
};

function getDarkenedColor(color: string) {
	if (color.length === 7) {
		const red = parseInt(color.slice(1, 3), 16);
		const green = parseInt(color.slice(3, 5), 16);
		const blue = parseInt(color.slice(5, 7), 16);
		return `rgb(${red * 0.5}, ${green * 0.5}, ${blue * 0.5})`;
	}

	if (color.length === 4) {
		const red = parseInt(color.slice(1, 2).repeat(2), 16);
		const green = parseInt(color.slice(2, 3).repeat(2), 16);
		const blue = parseInt(color.slice(3, 4).repeat(2), 16);
		return `rgb(${red * 0.5}, ${green * 0.5}, ${blue * 0.5})`;
	}

	return "rgba(0, 0, 0, 0.5)";
}

function CircularPollCanvas({
	segments,
	colors,
	size,
	strokeWidth,
}: CircularPollCanvasProperties) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const borderWidth = 4 * (size / 400);
	const canvasSize = size + borderWidth * 2;

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) {
			return;
		}

		const pixelRatio = window.devicePixelRatio || 1;
		canvas.width = canvasSize * pixelRatio;
		canvas.height = canvasSize * pixelRatio;
	}, [canvasSize]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) {
			return;
		}

		const pixelRatio = window.devicePixelRatio || 1;
		const context = canvas.getContext("2d");
		if (!context) {
			return;
		}

		context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
		context.clearRect(0, 0, canvasSize, canvasSize);
		context.lineCap = "butt";

		const center = canvasSize / 2;
		const ringWidth = (size * strokeWidth) / 100;
		const radius = size / 2 - ringWidth / 2;

		segments.forEach((segment, index) => {
			const percentage = Math.max(0, Math.min(segment.percentage, 100));
			if (percentage <= 0) {
				return;
			}

			const startAngle =
				-Math.PI / 2 + (segment.offset / 100) * Math.PI * 2;
			const endAngle = startAngle + (percentage / 100) * Math.PI * 2;
			const color = colors[index] || "#1890ff";
			context.beginPath();
			context.arc(center, center, radius, startAngle, endAngle);
			context.strokeStyle = getDarkenedColor(color);
			context.lineWidth = ringWidth + borderWidth * 2;
			context.lineCap = "butt";
			context.stroke();
			context.beginPath();
			context.arc(center, center, radius, startAngle, endAngle);
			context.strokeStyle = color;
			context.lineWidth = ringWidth;
			context.lineCap = "butt";
			context.stroke();
		});
	}, [colors, segments, canvasSize, size, strokeWidth]);

	return (
		<canvas
			ref={canvasRef}
			aria-hidden="true"
			style={{
				position: "absolute",
				left: `${-borderWidth}px`,
				top: `${-borderWidth}px`,
				width: `${canvasSize}px`,
				height: `${canvasSize}px`,
				pointerEvents: "none",
			}}
		/>
	);
}

export default function FullCircularPoll({
	poll,
	size = 400,
	timer = { active: false, current: 0, duration: 0, remainingSeconds: 0 },
	onlyTimer = false,
}: PollObjectProperties) {
	const { isDark } = useTheme();
	const { settings } = useSettings();
	const ringStrokeWidth = 23;
	const [hoveredSegment, setHoveredSegment] = useState<{
		answer: string;
		color?: string;
	} | null>(null);
	const [hoverPosition, setHoverPosition] = useState<{
		x: number;
		y: number;
	} | null>(null);

	const responderBase =
		typeof poll.totalResponders === "number" &&
		Number.isFinite(poll.totalResponders) &&
		poll.totalResponders > 0
			? poll.totalResponders
			: poll.responses.reduce(
					(acc, response) =>
						acc +
						(typeof response.responses === "number" &&
						Number.isFinite(response.responses)
							? response.responses
							: 0),
					0,
				);
	const answerBase = poll.responses.reduce(
		(acc, response) =>
			acc +
			(typeof response.responses === "number" &&
			Number.isFinite(response.responses)
				? response.responses
				: 0),
		0,
	);
	const segmentBase = poll.allowMultipleResponses
		? Math.max(responderBase, answerBase)
		: responderBase;
	const segmentTargets = poll.blind
		? [
				{
					percentage:
						poll.totalResponders > 0
							? (poll.totalResponses / poll.totalResponders) * 100
							: 0,
					offset: 0,
				},
			]
		: poll.responses.map((answer, index) => ({
				percentage:
					segmentBase > 0
						? (answer.responses / segmentBase) * 100
						: 0,
				offset:
					segmentBase > 0
						? poll.responses
								.slice(0, index)
								.reduce(
									(acc, current) =>
										acc +
										(current.responses / segmentBase) * 100,
									0,
								)
						: 0,
			}));
	const segmentTargetKey = segmentTargets
		.map(({ percentage, offset }) => `${percentage}:${offset}`)
		.join("|");
	const segmentAnimationDuration = 1000;
	const [animatedSegments, setAnimatedSegments] = useState(segmentTargets);
	const animatedSegmentsRef = useRef(animatedSegments);
	const animationFrameRef = useRef<number | null>(null);
	animatedSegmentsRef.current = animatedSegments;

	useEffect(() => {
		if (animationFrameRef.current !== null) {
			cancelAnimationFrame(animationFrameRef.current);
		}

		if (settings.accessibility.disableAnimations) {
			animatedSegmentsRef.current = segmentTargets;
			setAnimatedSegments(segmentTargets);
			return;
		}

		const startSegments = animatedSegmentsRef.current;
		const startTime = performance.now();
		const animateSegments = (currentTime: number) => {
			const progress = Math.min(
				(currentTime - startTime) / segmentAnimationDuration,
				1,
			);
			const easedProgress = 1 - Math.pow(1 - progress, 3);
			const nextSegments = segmentTargets.map((target, index) => {
				const start = startSegments[index] ?? {
					percentage: 0,
					offset: 0,
				};
				return {
					percentage:
						start.percentage +
						(target.percentage - start.percentage) * easedProgress,
					offset:
						start.offset +
						(target.offset - start.offset) * easedProgress,
				};
			});

			animatedSegmentsRef.current = nextSegments;
			setAnimatedSegments(nextSegments);
			if (progress < 1) {
				animationFrameRef.current =
					requestAnimationFrame(animateSegments);
			} else {
				animationFrameRef.current = null;
			}
		};

		animationFrameRef.current = requestAnimationFrame(animateSegments);
		return () => {
			if (animationFrameRef.current !== null) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, [segmentTargetKey, settings.accessibility.disableAnimations]);

	const getHoveredAnswerFromEvent = (
		event: React.MouseEvent<HTMLDivElement>,
	) => {
		if (poll.blind || segmentBase <= 0) {
			return null;
		}

		const rect = event.currentTarget.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;
		const dx = event.clientX - centerX;
		const dy = event.clientY - centerY;
		const distance = Math.sqrt(dx * dx + dy * dy);
		const outerRadius = rect.width / 2;
		const ringThickness = (rect.width * ringStrokeWidth) / 100;
		const innerRadius = Math.max(0, outerRadius - ringThickness);

		if (distance > outerRadius || distance < innerRadius) {
			return null;
		}

		const angleFromTopClockwise =
			((Math.atan2(dy, dx) * 180) / Math.PI + 90 + 360) % 360;
		const percentageFromAngle = (angleFromTopClockwise / 360) * 100;

		let cumulativePercentage = 0;
		for (const [index, response] of poll.responses.entries()) {
			const responseCount =
				typeof response.responses === "number" &&
				Number.isFinite(response.responses)
					? response.responses
					: 0;
			const responsePercentage =
				responseCount === 0 ? 0 : (responseCount / segmentBase) * 100;
			if (responsePercentage <= 0) {
				continue;
			}

			cumulativePercentage += responsePercentage;
			if (percentageFromAngle <= cumulativePercentage) {
				return {
					answer: response.answer,
					color: accessiblePollColor(
						response.color,
						settings.accessibility.colorVisionMode,
						index,
					),
				};
			}
		}

		return null;
	};

	return (
		<div
			style={{
				position: "relative",
				width: onlyTimer ? `${size / 2}px` : `${size}px`,
				height: onlyTimer ? `${size / 2}px` : `${size}px`,
			}}
		>
			<div
				style={{
					position: "absolute",
					inset: 0,
					zIndex: 5,
					cursor: "default",
				}}
				onMouseMove={(event) => {
					const segment = getHoveredAnswerFromEvent(event);
					setHoveredSegment(segment);
					const rect = event.currentTarget.getBoundingClientRect();
					setHoverPosition({
						x: event.clientX - rect.left,
						y: event.clientY - rect.top,
					});
				}}
				onMouseLeave={() => {
					setHoveredSegment(null);
					setHoverPosition(null);
				}}
			/>
			{/* Timer */}
			{timer.duration > 0 && (
				<Progress
					style={{
						position: "absolute",
						pointerEvents: "none",
						left: "50%",
						top: "50%",
						transform: "translate(-50%, -50%)",
					}}
					type="dashboard"
					percent={Math.round(timer.current)}

					format={() => `${formatTime(timer.remainingSeconds)}`}
					strokeColor={{
						"0%": "rgb(94, 158, 230)",
						"100%": "rgba(41, 96, 167, 0.9)",
					}}
					strokeWidth={15}
					gapDegree={50}
					size={size / 2}
				/>
			)}
			{!onlyTimer && (
				<>
					<Progress
						style={{
							position: "absolute" as "absolute",
							pointerEvents: "none",
							left: "50%",
							top: "50%",
							transform: "translate(-50%, -50%)",
						}}
						type="circle"
						percent={100}
						strokeColor={
							isDark
								? {
										"0%": "rgba(255, 255, 255, 0.38)",
										"100%": "rgba(255, 255, 255, 0.1)",
									}
								: {
										"0%": "#e6e6e6",
										"100%": "#bfbfbf",
									}
						}
						size={size}
						strokeWidth={ringStrokeWidth}
						railColor="transparent"
						showInfo={false}
						strokeLinecap="butt"
						styles={{
							root: {
								filter: "drop-shadow(0 0 5px #0004)",
							},
						}}
					/>
					<CircularPollCanvas
						segments={animatedSegments}
						colors={
							poll.blind
								? ["#ff9f22"]
								: poll.responses.map(
										(answer, index) =>
											accessiblePollColor(
												answer.color,
												settings.accessibility
													.colorVisionMode,
												index,
											) ?? "#1890ff",
									)
						}
						size={size}
						strokeWidth={ringStrokeWidth}
					/>
					{!poll.blind && hoveredSegment && hoverPosition ? (
						<div
							style={{
								position: "absolute",
								left: hoverPosition.x,
								top: hoverPosition.y - 20,
								transform: "translate(-50%, -50%)",
								zIndex: 10,
								pointerEvents: "none",
								backgroundColor:
									hoveredSegment.color ||
									"rgba(0, 0, 0, 0.78)",
								border: `1px solid #000`,
								color: textColorForBackground(
									hoveredSegment.color ||
										"rgba(0, 0, 0, 0.78)",
								),
								padding: "4px 8px",
								borderRadius: 6,
								fontSize: 12,
								whiteSpace: "nowrap",
							}}
						>
							{hoveredSegment.answer} -{" "}
							{`${poll.responses.find((e) => e.answer === hoveredSegment.answer)?.responses} Vote${poll.responses.find((e) => e.answer === hoveredSegment.answer)?.responses === 1 ? "" : "s"}`}
						</div>
					) : null}
				</>
			)}
		</div>
	);
}
