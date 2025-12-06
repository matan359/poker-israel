import React from 'react';

import Card from '../cards/Card';
import HiddenCard from '../cards/HiddenCard';

import PlayerStatusNotificationBox from "./PlayerStatusNotificationBox";

const dealerChipImageURL = "/assets/chip.svg";
const chipCountImageURL = "/assets/chips.svg";
const playerBetImageURL = "/assets/bet.svg";

const Player = (props) => {
  const {
    arrayIndex,
    playerAnimationSwitchboard,
    endTransition,
    hasDealerChip,
    isActive,
    phase,
    clearCards,
    isCurrentUser = false, // Is this the current user's player?
    player: {
      robot,
      folded,
      cards,
      avatarURL,
      name,
      chips,
      bet
    }
  } = props;

  const renderDealerChip = () => {
    if (hasDealerChip) {
      return (
        <div className="dealer-chip-icon-container">
          <img src={dealerChipImageURL} alt="Dealer Chip"/>
        </div>
      )
    } else return null;
  }

  const renderPlayerCards = () => {
    // Safety check: ensure cards exists and is an array
    if (!cards || !Array.isArray(cards)) {
      return null;
    }

    let applyFoldedClassname;

    if (folded || clearCards) {
      applyFoldedClassname = true
    }

    // Show cards only if:
    // 1. This is the current user's player, OR
    // 2. It's a robot and we're in showdown, OR
    // 3. It's showdown phase (all cards visible)
    const shouldShowCards = isCurrentUser || phase === 'showdown';

    if (robot || !isCurrentUser) {
      // For robots or other players: show hidden cards unless showdown
      return cards.map((card, index)=> {
        if (shouldShowCards) {
          // Show actual cards in showdown or if it's the current user
          const cardData = {...card, animationDelay: phase === 'showdown' ? 0 : card.animationDelay}
          return(
            <Card key={index} cardData={cardData} applyFoldedClassname={applyFoldedClassname}/>
          );
        } else {
          // Show hidden cards for other players/robots
          return(
            <HiddenCard key={index} cardData={card} applyFoldedClassname={applyFoldedClassname}/>
          );
        }
      });
    }
    else {
      // Current user's cards - always show
      return cards.map((card, index) => {
        return(
          <Card key={index} cardData={card} applyFoldedClassname={applyFoldedClassname}/>
        );
      });
    }
  }

  const ifAnimating = (playerBoxIndex) => { 
    if (playerAnimationSwitchboard[playerBoxIndex].isAnimating) {
      return true;
    } else {
      return false;
    }
  }

  return (
    <div className={`player-entity--wrapper p${arrayIndex}`}>
      <PlayerStatusNotificationBox
        index={arrayIndex}
        isActive={ifAnimating(arrayIndex)}
        content={playerAnimationSwitchboard[arrayIndex].content}
        endTransition={endTransition}
      />
      <div className='centered-flex-row abscard'>
        { renderPlayerCards() }
      </div>
      <div className="player-entity--container">
        <div className="player-avatar--container">
          <img 
            className={`player-avatar--image${(isActive ? ' activePlayer' : '')}`} 
            src={avatarURL} 
            alt="Player Avatar" 
          />
          <h5 className="player-info--name" style={{'fontSize': (name.length < 14) ? 12 : 10}}>
            {`${name}`}
          </h5>
          <div className="player-info--stash--container">
            <img className="player-info--stash--image" src={chipCountImageURL} alt="Player Stash"/>
            <h5>{`${chips}`}</h5>
          </div>
          <div className="player-info--bet--container">
            <img className="player-info--bet--image" src={playerBetImageURL} alt="Player Bet" />
            <h5>{`Bet: ${bet}`}</h5>
          </div>
          { renderDealerChip() }
        </div>
      </div>
    </div>
  )
}

export default Player;