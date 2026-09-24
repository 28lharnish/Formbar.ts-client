import { useClassData, useMobileDetect } from "@/main";
import { Card, Flex, Statistic, Tooltip, Typography } from "antd";
const { Title } = Typography;
import { IonIcon } from "@ionic/react";
import * as IonIcons from "ionicons/icons";


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

	const responseTimes = studentVoters.flatMap((student) => {
		if (!student.pollRes?.time || !classData?.poll?.startTime) return [];

		const responseTimeMs = new Date(student.pollRes.time).getTime();
		const seconds = (responseTimeMs - classData.poll.startTime) / 1000;
		return Number.isFinite(seconds) && seconds > 0 ? [seconds] : [];
	});
	const responseTime = responseTimes.length
		? responseTimes.reduce((total, seconds) => total + seconds, 0) /
			responseTimes.length
		: 0;
	const responses = responseTimes.length;
	const studentsOnBreak = studentVoters.filter((student) => student.break).length;
	const helpTickets = studentVoters.filter((student) => student.help).length;

	const pollStartTime = classData?.poll?.startTime;
	const statistics: Array<{
        title: string;
        stats: Array<{
            title: string;
            value: number | string;
            type?: string;
            format?: string;
            precision?: number;
            prefix?: React.ReactNode;
            suffix?: string;
        }>;
	}> = [
        {
            title: "Current Poll",
            stats: [
                {
                    title: "Poll Runtime",
					value: pollStartTime ?? 0,
					type: pollStartTime ? "timer" : undefined,
                    format: "H:mm:ss",
                },
                {
                    title: "Allowed to Vote",
                    value: eligibleVoters.length,
                },
                {
                    title: "Response Time",
                    value: formatDuration(responseTime),
                    prefix: (<>
                        <IonIcon
                            icon={IonIcons.arrowUp}
                            style={{ marginTop: "2px" }}
                        />
                    </>),
                },
                {
                    title: "Responses",
                    value: responses,
                    suffix: `/ ${eligibleVoters.length}`,
                },
            ],
        },
        {
            title: "Users",
            stats: [
                {
                    title: "Help Tickets",
                    value: helpTickets,
                },
                {
                    title: "On Break",
                    value: studentsOnBreak,
                },
                {
                    title: "Total Students",
                    value: students.filter((s: any) => s.id !== classData?.owner)
                        .length,
                },
            ],
        },
	];

	return (
		<>
			<Flex style={{height: '100%', maxHeight: '100%', padding: 20, paddingBottom: 0}} vertical justify="start" align="center" gap={20}>
				<Title level={isMobile ? 3 : 1} style={{ marginBottom: 0, flexShrink: 0 }}>Statistics</Title>
				<Flex gap={20} wrap="wrap" justify="center" align="center" style={{flex: '1 1 0', overflowY:'auto', width: '100%', paddingBottom: '20px'}}>
                    {statistics.map((card, cardIndex) => (
                        <Card key={cardIndex} title={card.title} styles={!isMobile ? {body: gridStyle} : {body: {display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto"}}}>
                            {card.stats.map((stat, statIndex) => {
                                const statContent = stat.type === "timer" ? (
                                    <Statistic.Timer
                                        type="countup"
                                        title={stat.title}
                                        value={stat.value}
                                        format={stat.format}
                                    />
                                ) : (
                                    <Statistic
                                        title={stat.title}
                                        value={stat.value}
                                        precision={stat.precision}
                                        prefix={stat.prefix}
                                        suffix={stat.suffix}
                                    />
                                );

                                const cardContent = (
                                    <Card key={statIndex} variant="borderless">
                                        {statContent}
                                    </Card>
                                );

                                // Add tooltip for Response Time stat
                                if (stat.title === "Response Time") {
                                    return (
                                        <Tooltip
                                            key={statIndex}
                                            mouseEnterDelay={0.5}
                                            title={
												"Average Response Time: " +
												formatDuration(responseTime)
                                            }
                                            placement="top"
                                        >
                                            <Card variant="borderless">
                                                <Statistic
                                                    title={stat.title}
                                                    value={stat.value}
                                                    precision={stat.precision}
                                                    styles={{
                                                        content: { color: "#3f8600" },
                                                    }}
                                                    style={{
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                    }}
                                                    prefix={stat.prefix}
                                                    suffix={stat.suffix}
                                                />
                                            </Card>
                                        </Tooltip>
                                    );
                                }

                                return cardContent;
                            })}
                        </Card>
                    ))}
				</Flex>
			</Flex>
		</>
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

const gridStyle = {
	display: "grid",
	gridTemplateColumns: "repeat(2, minmax(200px, 1fr))",
	gap: "10px",
};
