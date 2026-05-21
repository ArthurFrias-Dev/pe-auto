/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export default function Logo({ className = '', onClick }: { className?: string; onClick?: () => void }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} onClick={onClick}>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="font-sans font-black tracking-wider text-xl text-white uppercase">
            PEÇ<span className="text-[#FFC72C]">AUTO</span>
          </span>
        </div>
        <p className="text-[9px] text-gray-400 font-mono tracking-widest uppercase">
          Gestão de Oficina & Peças
        </p>
      </div>
    </div>
  );
}
