import React from 'react';
import { 
  renderUnicodeSuitSymbol 
} from '../../utils/ui';

const Card = (props) => {
  const { 
    cardData: {
      suit,
      cardFace,
      animationDelay
    },
    applyFoldedClassname
  } = props;
  
  const isRed = suit === 'Diamond' || suit === 'Heart';
  const suitSymbol = renderUnicodeSuitSymbol(suit);
  
  return(
    <div 
      key={`${suit} ${cardFace}`} 
      className={`playing-card cardIn ${(applyFoldedClassname ? ' folded' : '')} ${isRed ? 'red-suit' : 'black-suit'}`} 
      style={{animationDelay: `${(applyFoldedClassname) ?  0 : animationDelay}ms`}}>
      {/* Top corner - value and suit */}
      <div className="card-corner card-corner-top">
        <div className="card-value">{cardFace}</div>
        <div className="card-suit-small">{suitSymbol}</div>
      </div>
      
      {/* Center - large suit symbol */}
      <div className="card-center">
        <div className="card-suit-large">{suitSymbol}</div>
      </div>
      
      {/* Bottom corner - value and suit (rotated) */}
      <div className="card-corner card-corner-bottom">
        <div className="card-value">{cardFace}</div>
        <div className="card-suit-small">{suitSymbol}</div>
      </div>
    </div>
  )
}

export default Card;