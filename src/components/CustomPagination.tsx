import { useMobileDetect, useTheme } from "@/main";
import {
	AutoComplete,
	Pagination,
	type GetProps,
	type PaginationProps,
} from "antd";
import { useEffect, useState } from "react";

type SizeChangerComponent = Required<NonNullable<PaginationProps['components']>>['sizeChanger'];
type SizeChangerProps = GetProps<SizeChangerComponent>;

export type CustomPaginationProps = {
	currentPage: number;
	pageSize: number;
	total: number;

	onChange: (page: number, size: number) => void;

	style?: React.CSSProperties;
};

const validPageSizes = [ 12, 24, 48, 100, 200 ]

const SizeChanger = (props: SizeChangerProps) => {
	const { disabled, value, onChange, className } = props;
	const [draftValue, setDraftValue] = useState(String(value));

	useEffect(() => {
		setDraftValue(String(value));
	}, [value]);

	const commitValue = () => {
		if (/^\d+$/.test(draftValue)) {
			const nextSize = Number(draftValue);
			if (nextSize >= 1 && nextSize <= 200) {
				onChange(nextSize);
				return;
			}
		}

		setDraftValue(String(value));
	};

	return (
		<AutoComplete
			aria-label="Page size"
			className={className}
			disabled={disabled}
			options={validPageSizes.map((size) => ({
				label: `${size} / page`,
				value: String(size),
			}))}
			value={draftValue}
			onChange={setDraftValue}
			onSelect={setDraftValue}
			onBlur={commitValue}
			placeholder="Page size"
			style={{ minWidth: 100, padding: "0 0.5em" }}
			styles={{
				content: {
					width: 60,
				},
			}}
			suffix="/ page"
		/>
	);
};

export default function CustomPagination({
	currentPage,
	pageSize,
	total,

	style,

	onChange,
}: CustomPaginationProps) {	
	const isMobile = useMobileDetect();
	const { isDark } = useTheme();

	return (
		<Pagination
			current={currentPage}
			pageSize={pageSize}
			total={total}
			components={{
				sizeChanger: isMobile ? undefined : SizeChanger
				
			}}
			pageSizeOptions={validPageSizes}
			showTotal={(total, [start, end]) => `${start}-${end} of ${total}`}
			onChange={onChange}
			style={{
				width: isMobile ? "100%" : "initial",
				marginInline: isMobile ? 8 : 0,
				background: isDark ? "#020b24ab" : "#fffa",
				border: isDark ? '1px solid #070a2786' : "1px solid #00000020",
				padding: "0.125em 0.75em",
				borderRadius: 10,
				backdropFilter: "blur(5px)",
				...style,
			}}
		/>
	);
}
