import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { api } from "../../services/axios";

const PlayerInfo = forwardRef(({ user, currentScene, sessionId, onStatusUpdate }, ref) => {
	const [playerStatus, setPlayerStatus] = useState({
		health: 100,
		maxHealth: 100,
		level: 1,
		experience: 0,
		gold: 10,
		currentScene: "starting_village",
		inventory: { items: [] },
	});
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (sessionId) {
			fetchPlayerStatus();
		}
	}, [sessionId, currentScene]);

	const fetchPlayerStatus = async () => {
		try {
			setLoading(true);
			const response = await api.get(`/game/session/${sessionId}/status`);
			setPlayerStatus(response.data);

			if (onStatusUpdate) {
				onStatusUpdate(response.data);
			}
		} catch (error) {
			console.error("Failed to fetch player status:", error);
		} finally {
			setLoading(false);
		}
	};

	useImperativeHandle(ref, () => ({
		fetchPlayerStatus,
	}));

	const healthPercentage = playerStatus.maxHealth > 0 ? Math.floor((playerStatus.health / playerStatus.maxHealth) * 100) : 100;

	return (
		<div className="card bg-base-100 shadow-xl mb-6">
			<div className="card-body">
				<h2 className="card-title">Player Info</h2>
				<div className="flex items-center gap-4">
					<div className="avatar placeholder">
						<div className="bg-neutral text-neutral-content rounded-full w-16">
							<span className="text-2xl">{user?.name?.charAt(0) || "A"}</span>
						</div>
					</div>
					<div>
						<p className="font-bold text-lg">{user?.name || "Adventurer"}</p>
						<p className="text-sm opacity-70">New World Adventurer (Lv. {playerStatus.level})</p>
					</div>
				</div>

				<div className="stats stats-vertical shadow mt-4">
					<div className="stat">
						<div className="stat-title">Health</div>
						<div className="stat-value text-primary">{healthPercentage}%</div>
						<progress className="progress progress-primary w-full" value={playerStatus.health} max={playerStatus.maxHealth}></progress>
						<div className="stat-desc">
							{playerStatus.health}/{playerStatus.maxHealth} HP
						</div>
					</div>

					<div className="stat">
						<div className="stat-title">Experience</div>
						<div className="stat-value text-accent">{playerStatus.experience} XP</div>
						<div className="stat-desc">Next level: 100 XP</div>
					</div>

					<div className="stat">
						<div className="stat-title">Gold</div>
						<div className="stat-value text-warning">{playerStatus.gold}</div>
						<div className="stat-desc">New world currency</div>
					</div>

					<div className="stat">
						<div className="stat-title">Current Scene</div>
						<div className="stat-value text-secondary">{playerStatus.currentScene === "starting_village" ? "Village Gate" : playerStatus.currentScene}</div>
						<div className="stat-desc">Be careful!</div>
					</div>
				</div>

				<div className="collapse collapse-arrow bg-base-200 mt-4">
					<input type="checkbox" />
					<div className="collapse-title font-medium">Inventory ({playerStatus.inventory?.items?.length || 0} items)</div>
					<div className="collapse-content">
						<div className="overflow-x-auto">
							{playerStatus.inventory?.items?.length > 0 ? (
								<table className="table table-xs">
									<thead>
										<tr>
											<th>Item</th>
											<th>Qty</th>
											<th>Effect</th>
										</tr>
									</thead>
									<tbody>
										{playerStatus.inventory.items.map((item) => (
											<tr key={item.id}>
												<td>{item.name}</td>
												<td>{item.quantity}</td>
												<td>{item.effect}</td>
											</tr>
										))}
									</tbody>
								</table>
							) : (
								<p className="text-center p-2">Your inventory is empty</p>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
});

export default PlayerInfo;
