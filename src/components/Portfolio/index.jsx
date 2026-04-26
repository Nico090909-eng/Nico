import React, { useState, useCallback } from 'react'
import PortfolioGlobale from './PortfolioGlobale'
import Positions from './Positions'
import Edition from './Edition'
import Performance from './Performance'

const SUB_TABS = [
  { id: 'globale',     label: 'Vue Globale' },
  { id: 'positions',   label: 'Positions'   },
  { id: 'edition',     label: 'Édition'     },
  { id: 'performance', label: 'Performance' },
]

export default function Portfolio(props) {
  const [sub, setSub]               = useState('globale')
  const [bucketFilter, setBucketFilter] = useState(null)

  const goToBucket = useCallback((bucket) => {
    setBucketFilter(bucket)
    setSub('positions')
  }, [])

  const handleSubChange = useCallback((id) => {
    setSub(id)
    if (id !== 'positions') setBucketFilter(null)
  }, [])

  return (
    <div>
      <div className="sub-tabs">
        {SUB_TABS.map(t => (
          <button
            key={t.id}
            className={`sub-tab${sub === t.id ? ' active' : ''}`}
            onClick={() => handleSubChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sub === 'globale'     && <PortfolioGlobale portfolio={props.portfolio} onBucketClick={goToBucket} />}
      {sub === 'positions'   && <Positions portfolio={props.portfolio} filterBucket={bucketFilter} onClearFilter={() => setBucketFilter(null)} />}
      {sub === 'edition'     && <Edition portfolio={props.portfolio} onSave={props.saveAll} onAdd={props.addPosition} onDelete={props.deletePosition} setIncome={props.setIncome} />}
      {sub === 'performance' && <Performance portfolio={props.portfolio} onAddSnapshot={props.addSnapshot} onDeleteSnapshot={props.deleteSnapshot} />}
    </div>
  )
}
