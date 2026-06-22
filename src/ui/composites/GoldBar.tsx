import { Counter, Row } from "../primitives";

/** Persistent wallet + pending-chest readout for the top bar. */
export function GoldBar({ gold, chests }: { gold: number; chests: number }) {
  return (
    <Row>
      <Counter icon="🪙" value={gold} label="gold" />
      <Counter icon="🎁" value={chests} label="pending chests" />
    </Row>
  );
}
