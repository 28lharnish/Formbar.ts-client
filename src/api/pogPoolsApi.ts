import { http } from "@api/HTTPApi";

export function deletePool(poolId: number) {
	return http(`/pools/${poolId}`, "DELETE");
}

export function createPool(body: {
	name: string;
	description: string;
	pin?: string;
}) {
	return http("/pools/create", "POST", {}, body);
}

export function addPoolMember(
	poolId: number,
	body: {
		userId: string;
	},
) {
	return http(`/pools/${poolId}/add-member`, "POST", {}, body);
}

export function payoutPool(
	poolId: number,
	payoutPin: string | undefined,
	amount: number,
	payoutType: "Percent" | "Digipogs",
) {
	return http(
		`/pools/${poolId}/payout`,
		"POST",
		{},
		{
			amount,
			pin: payoutPin,
			payoutType: payoutType.toLowerCase(),
		},
	);
}

export function removePoolMember(
	poolId: number,
	body: {
		userId: string;
	},
) {
	return http(`/pools/${poolId}/remove-member`, "POST", {}, body);
}

export function updatePoolPin(
	poolId: number,
	body: {
		oldPin: string | undefined,
		pin: string | undefined
	}
) {
	return http(`/pool/${poolId}/pin`, "PATCH", {}, body);
}