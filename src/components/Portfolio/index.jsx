import React, { useState } from 'react'
import PortfolioGlobale from './PortfolioGlobale'
import Positions from './Positions'
import Edition from './Edition'
import Performance from './Performance'

const SUB_TABS = [
  { id: 'globale', label: 'Vue Globale' },
  { id: 'positions', label: 'Positions' },
  { id: 'edition', label: 'Édition' },
  { id: 'performance', label: 'Performance' },
]

export default function Portfolio(props) {
  const [sub, setSub] = useState('globale')

  return (
    <div>
      <div className="sub-tabs">
        {SUB_TABS.map(t => (
          <button
            key={t.id}
            className={`sub-tab${sub === t.id ? ' active' : ''}`}
            onClick={() => setSub(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sub === 'globale' && <PortfolioGlobale portfolio={props.portfolio} />}
      {sub === 'positions' && <Positions portfolio={props.portfolio} />}
      {sub === 'edition' && <Edition portfolio={props.portfolio} onSave={props.saveAll} onAdd={props.addPosition} onDelete={props.deletePosition} setIncome={props.setIncome} />}
      {sub === 'performance' && <Performance portfolio={props.portfolio} onAddSnapshot={props.addSnapshot} onDeleteSnapshot={props.deleteSnapshot} />}
    </div>
  )
}
