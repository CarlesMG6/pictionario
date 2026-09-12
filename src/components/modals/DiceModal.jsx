"use client";

import Modal from './Modal';
import Dice3D from '../Dice3D';
import '../Dice3D.css';

export default function DiceModal({ value }) {
  return (
    <Modal className="min-w-[340px] px-10 py-8">
      <Dice3D value={value} animate />
      <div className="gp-caption mt-5">Tirando el dado</div>
    </Modal>
  );
}
