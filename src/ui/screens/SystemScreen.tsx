import { useState } from "react";
import {
  Badge,
  Button,
  KeyValueList,
  LogList,
  Panel,
  Row,
  Screen,
  TextArea,
} from "../primitives";
import { loadGame } from "../../app/index";
import { SeededRng } from "../../domain/rng";
import type { OfflineReport } from "../../offline";
import { useAction } from "../state";

const DURATIONS: ReadonlyArray<{ label: string; ms: number }> = [
  { label: "1 min", ms: 60_000 },
  { label: "1 hour", ms: 3_600_000 },
  { label: "8 hours", ms: 28_800_000 },
];

/** Save / load round-trip + offline simulation (M20, M21). */
export function SystemScreen() {
  const { session, act, error, reload } = useAction();
  const [json, setJson] = useState("");
  const [report, setReport] = useState<OfflineReport | null>(null);
  const [note, setNote] = useState<string | null>(null);

  function handleSave() {
    setJson(JSON.stringify(session.save(), null, 2));
    setNote("Exported current state below.");
  }

  function handleLoad() {
    act(() => {
      const save = JSON.parse(json);
      reload(loadGame(save, new SeededRng(Date.now())));
      setNote("Loaded state from JSON.");
    });
  }

  function handleOffline(ms: number) {
    act(() => setReport(session.simulateOffline(ms)));
  }

  return (
    <Screen title="System">
      <Panel heading="Save / Load">
        <Row>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Export
          </Button>
          <Button size="sm" disabled={json.trim() === ""} onClick={handleLoad}>
            Import
          </Button>
        </Row>
        {note && <Badge tone="good">{note}</Badge>}
        {error && <Badge tone="bad">{error}</Badge>}
        <TextArea
          value={json}
          placeholder="Save JSON appears here on Export; paste here then Import."
          onChange={setJson}
        />
      </Panel>

      <Panel heading="Offline simulation">
        <Row>
          {DURATIONS.map((d) => (
            <Button key={d.ms} size="sm" onClick={() => handleOffline(d.ms)}>
              {d.label}
            </Button>
          ))}
        </Row>
        {report && (
          <KeyValueList
            rows={[
              {
                key: "elapsed",
                label: "elapsed (ms)",
                value: report.elapsedMs,
              },
              {
                key: "stages",
                label: "stages cleared",
                value: report.stagesCleared,
              },
              { key: "gold", label: "gold", value: report.gold },
              { key: "xp", label: "xp", value: report.xp },
              { key: "items", label: "items kept", value: report.items.length },
              {
                key: "lost",
                label: "items lost (full bag)",
                value: report.itemsLost,
              },
            ]}
          />
        )}
        {report && report.items.length > 0 && (
          <LogList lines={report.items.map((i) => `${i.rarity} ${i.name}`)} />
        )}
      </Panel>
    </Screen>
  );
}
