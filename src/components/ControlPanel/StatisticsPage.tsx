import { useClassData, useMobileDetect } from "@/main";
import { Card, Flex, Progress, Statistic, Tooltip, Typography } from "antd";
const { Title } = Typography;
export default function Statistics() {
	const { classData } = useClassData();

	const students =
		classData && classData.students
			? (Object.values(classData.students) as any[])
			: [];
	const classOwnerId = Number(classData?.owner);
	const studentVoters = students.filter(
		(student) => Number(student.id) !== classOwnerId,
	);
	const excludedVoterIds = new Set(
		(classData?.poll?.excludedRespondents ?? []).map((id) => Number(id)),
	);
	const eligibleVoters = studentVoters.filter(
		(student) => !student.isOffline && !excludedVoterIds.has(Number(student.id)),
	);

    const isMobile = useMobileDetect();

	const responseDetails = studentVoters.flatMap((student) => {
		if (!student.pollRes?.time || !classData?.poll?.startTime) return [];

		const responseTimeMs = new Date(student.pollRes.time).getTime();
		const seconds = (responseTimeMs - classData.poll.startTime) / 1000;
		return Number.isFinite(seconds) && seconds > 0 ? [{ student, seconds }] : [];
	});
	const responseTimes = responseDetails.map(({ seconds }) => seconds);
	const responseTime = responseTimes.length
		? responseTimes.reduce((total, seconds) => total + seconds, 0) /
			responseTimes.length
		: 0;
	const responses = responseTimes.length;
	const studentsOnBreak = studentVoters.filter((student) => student.break).length;
	const helpTickets = studentVoters.filter((student) => student.help).length;
	const pollAnswers = classData?.poll?.responses ?? [];
	const totalPollResponses = pollAnswers.reduce(
		(total, answer) => total + (Number(answer.responses) || 0),
		0,
	);
	const responseRate = eligibleVoters.length
		? (responses / eligibleVoters.length) * 100
		: 0;
	const fastestResponse = responseTimes.length ? Math.min(...responseTimes) : 0;
	const slowestResponse = responseTimes.length ? Math.max(...responseTimes) : 0;
	const fastestResponseDetail = responseDetails.find(({ seconds }) => seconds === fastestResponse);
	const slowestResponseDetail = responseDetails.find(({ seconds }) => seconds === slowestResponse);
	const onlineStudents = studentVoters.filter((student) => !student.isOffline).length;
	const responseBuckets = [
		{ label: "Under 5s", value: responseTimes.filter((time) => time < 5).length },
		{ label: "5-15s", value: responseTimes.filter((time) => time >= 5 && time < 15).length },
		{ label: "15-30s", value: responseTimes.filter((time) => time >= 15 && time < 30).length },
		{ label: "30s+", value: responseTimes.filter((time) => time >= 30).length },
	];

	return (
		<Flex
			vertical
			gap={20}
			style={{ height: "100%", overflowY: "auto", padding: isMobile ? 12 : 24 }}
		>
			<Flex justify="space-between" align={isMobile ? "start" : "center"} vertical={isMobile} gap={8}>
				<div>
					<Title level={isMobile ? 3 : 1} style={{ margin: 0 }}>Statistics</Title>
					<Typography.Text type="secondary">
						{classData?.className ?? "Class overview"} · {classData?.poll?.status ? "Poll open" : "Poll closed"}
					</Typography.Text>
				</div>
				<Statistic.Timer
					type="countup"
					title="Current poll runtime"
					value={classData?.poll?.startTime ?? 0}
					format="H:mm:ss"
				/>
			</Flex>

			<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
				<StatisticCard title="Response rate" value={`${Math.round(responseRate)}%`} color="#66b5ff" />
				<StatisticCard title="Responses" value={`${responses} / ${eligibleVoters.length}`} />
				<StatisticCard title="Average response" value={formatDuration(responseTime)} />
				<StatisticCard title="Online students" value={`${onlineStudents} / ${studentVoters.length}`} />
			</div>

			<div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.35fr) minmax(280px, 0.65fr)", gap: 20 }}>
				<Card title="Current poll" style={{ height: "100%" }}>
					<Flex vertical gap={18}>
						<Typography.Text strong>{classData?.poll?.prompt || "No poll prompt available"}</Typography.Text>
						<Progress percent={Math.round(responseRate)} strokeColor="#66b5ff" format={(percent) => `${percent}% participation`} />
						<Flex
							vertical
							gap={12}
							style={{
								maxHeight: isMobile ? 280 : 360,
								overflowY: "auto",
								paddingRight: 8,
							}}
						>
							{pollAnswers.length > 0 ? pollAnswers.map((answer, index) => {
								const count = Number(answer.responses) || 0;
								const percentage = totalPollResponses ? (count / totalPollResponses) * 100 : 0;
								return (
									<div key={`${answer.answer}-${index}`}>
										<Flex justify="space-between" gap={12}>
											<Typography.Text ellipsis>{answer.answer}</Typography.Text>
											<Typography.Text type="secondary">{count} · {Math.round(percentage)}%</Typography.Text>
										</Flex>
										<Progress percent={percentage} showInfo={false} strokeColor={answer.color || "#66b5ff"} />
									</div>
								);
							}) : <Typography.Text type="secondary">No answer data yet.</Typography.Text>}
						</Flex>
					</Flex>
				</Card>

				<Card title="Class activity" style={{ height: "100%" }}>
					<div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
						<Statistic title="Eligible to vote" value={eligibleVoters.length} />
						<Statistic title="Total students" value={studentVoters.length} />
						<Statistic title="On break" value={studentsOnBreak} />
						<Statistic title="Help tickets" value={helpTickets} />
						<Statistic title="Offline" value={studentVoters.length - onlineStudents} />
						<Statistic title="Excluded" value={excludedVoterIds.size} />
					</div>
				</Card>
			</div>

			<Card title="Response timing">
				<div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 20 }}>
					<Statistic title="Average" value={formatDuration(responseTime)} />
					<Tooltip placement="left" title={responseDetailLabel(fastestResponseDetail?.student)}>
						<Statistic title="Fastest" value={formatDuration(fastestResponse)} />
					</Tooltip>
					<Tooltip placement="left" title={responseDetailLabel(slowestResponseDetail?.student)}>
						<Statistic title="Slowest" value={formatDuration(slowestResponse)} />
					</Tooltip>
				</div>
				<Flex vertical gap={10} style={{ marginTop: 20 }}>
					{responseBuckets.map((bucket) => (
						<Flex key={bucket.label} align="center" gap={12}>
							<Typography.Text style={{ width: 70 }}>{bucket.label}</Typography.Text>
							<Progress percent={responses ? (bucket.value / responses) * 100 : 0} showInfo={false} style={{ flex: 1 }} />
							<Typography.Text type="secondary" style={{ width: 24, textAlign: "right" }}>{bucket.value}</Typography.Text>
						</Flex>
					))}
				</Flex>
			</Card>
		</Flex>
	);
}

function StatisticCard({ title, value, color }: { title: string; value: string; color?: string }) {
	return (
		<Card size="small">
			<Statistic title={title} value={value} styles={color ? { content: { color } } : undefined} />
		</Card>
	);
}

function formatDuration(totalSeconds: number) {
	const seconds = Math.max(0, Math.round(totalSeconds));
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainingSeconds = seconds % 60;

	if (hours > 0) return `${hours}h ${minutes}m ${remainingSeconds}s`;
	if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
	return `${remainingSeconds}s`;
}

function responseDetailLabel(student: any) {
	if (!student) {
		return "No response recorded";
	}

	const buttonResponse = Array.isArray(student.pollRes?.buttonRes)
		? student.pollRes.buttonRes.join(", ")
		: student.pollRes?.buttonRes;
	const textResponse = student.pollRes?.textRes;
	const response = [buttonResponse, textResponse].filter(Boolean).join(" · ") || "No answer text";

	return `${student.displayName ?? "Unknown student"}: ${response}`;
}

