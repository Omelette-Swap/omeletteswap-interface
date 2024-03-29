import React, { useMemo } from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { useWeb3React, UnsupportedChainIdError } from '@web3-react/core'
import { darken, lighten } from 'polished'
import { Activity } from 'react-feather'
import useENSName from '../../hooks/useENSName'
import { useHasSocks } from '../../hooks/useSocksBalance'
import { useWalletModalToggle } from '../../state/application/hooks'
import { TransactionDetails } from '../../state/transactions/reducer'
import { useIsDarkMode } from '../../state/user/hooks'
import Identicon from '../Identicon'
import WalletModal from '../WalletModal'
import { ButtonSecondary } from '../Button'
import WalletConnectIcon from '../../assets/images/walletConnectIcon.svg'
import CoinbaseWalletIcon from '../../assets/images/coinbaseWalletIcon.svg'
import { RowBetween } from '../Row'
import { shortenAddress } from '../../utils'
import { useAllTransactions } from '../../state/transactions/hooks'
import { NetworkContextName } from '../../constants'
import { injected, walletconnect, walletlink } from '../../connectors'
import Loader from '../Loader'
import { TYPE } from '../../theme'

const IconWrapper = styled.div<{ size?: number }>`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  & > * {
    height: ${({ size }) => (size ? size + 'px' : '32px')};
    width: ${({ size }) => (size ? size + 'px' : '32px')};
  }
`

const Web3StatusGeneric = styled(ButtonSecondary)`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  align-items: center;
  padding: 0.5rem;
  border-radius: 12px;
  cursor: pointer;
  user-select: none;
  :focus {
    outline: none;
  }
`

const Web3StatusError = styled(Web3StatusGeneric)`
  background-color: ${({ theme }) => theme.red1};
  border: 1px solid ${({ theme }) => theme.red1};
  color: ${({ theme }) => theme.white};
  font-weight: 500;
  :hover,
  :focus {
    background-color: ${({ theme }) => darken(0.1, theme.red1)};
  }
`

const Web3StatusConnected = styled(Web3StatusGeneric)<{ pending?: boolean }>`
  background-color: ${({ pending, theme }) => (pending ? theme.bg2 : theme.bg2)};
  border: 1px solid ${({ pending, theme }) => (pending ? theme.bg6 : theme.bg6)};
  color: ${({ pending, theme }) => (pending ? theme.white : theme.text1)};
  font-weight: 500;
  :hover {
    background-color: ${({ pending, theme }) => (pending ? darken(0.05, theme.bg4) : lighten(0.05, theme.bg4))};

    :focus {
      border: 1px solid ${({ pending, theme }) => (pending ? darken(0.1, theme.bg3) : darken(0.1, theme.bg3))};
    }
  }
`

const Text = styled.p`
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0 0.5rem 0 0.25rem;
  font-size: 1rem;
  width: fit-content;
  font-weight: 500;
  color: ${({ theme }) => theme.networkColor};
`

const NetworkIcon = styled(Activity)`
  margin-left: 0.25rem;
  margin-right: 0.5rem;
  width: 16px;
  height: 16px;
`

// we want the latest one to come first, so return negative if a is after b
function newTranscationsFirst(a: TransactionDetails, b: TransactionDetails) {
  return b.addedTime - a.addedTime
}

function recentTransactionsOnly(a: TransactionDetails) {
  return new Date().getTime() - a.addedTime < 86_400_000
}

const SOCK = (
  <span role="img" aria-label="has socks emoji" style={{ marginTop: -4, marginBottom: -4 }}>
    🧦
  </span>
)

export default function Web3Status() {
  const { t } = useTranslation()
  const { active, account, connector, error } = useWeb3React()
  const contextNetwork = useWeb3React(NetworkContextName)
  const darkMode = useIsDarkMode()
  const { ENSName } = useENSName(account)

  const allTransactions = useAllTransactions()

  const sortedRecentTransactions = useMemo(() => {
    const txs = Object.values(allTransactions)
    return txs.filter(recentTransactionsOnly).sort(newTranscationsFirst)
  }, [allTransactions])

  const pending = sortedRecentTransactions.filter(tx => !tx.receipt).map(tx => tx.hash)
  const confirmed = sortedRecentTransactions.filter(tx => tx.receipt).map(tx => tx.hash)

  const hasPendingTransactions = !!pending.length
  const hasSocks = useHasSocks()
  const toggleWalletModal = useWalletModalToggle()

  // handle the logo we want to show with the account
  function getStatusIcon() {
    if (connector === injected) {
      return <Identicon />
    } else if (connector === walletconnect) {
      return (
        <IconWrapper size={16}>
          <img src={WalletConnectIcon} alt={''} />
        </IconWrapper>
      )
    } else if (connector === walletlink) {
      return (
        <IconWrapper size={16}>
          <img src={CoinbaseWalletIcon} alt={''} />
        </IconWrapper>
      )
    }
  }

  function getWeb3Status() {
    if (account) {
      return (
        <Web3StatusConnected id="web3-status-connected" onClick={toggleWalletModal} pending={hasPendingTransactions}>
          {hasPendingTransactions ? (
            <RowBetween>
              <Text>{pending?.length} Pending</Text> <Loader stroke={darkMode ? 'white' : 'black'} />
            </RowBetween>
          ) : (
            <>
              {hasSocks ? SOCK : null}
              <Text>{ENSName || shortenAddress(account)}</Text>
            </>
          )}
          {!hasPendingTransactions && getStatusIcon()}
        </Web3StatusConnected>
      )
    } else if (error) {
      return (
        <Web3StatusError onClick={toggleWalletModal}>
          <NetworkIcon />
          <TYPE.black>{error instanceof UnsupportedChainIdError ? 'Wrong Network' : 'Error'}</TYPE.black>
        </Web3StatusError>
      )
    } else {
      return (
        <Web3StatusConnected id="connect-wallet" onClick={toggleWalletModal}>
          <Text>{t('Connect to a wallet')}</Text>
        </Web3StatusConnected>
      )
    }
  }

  if (!contextNetwork.active && !active) {
    return null
  }

  return (
    <>
      {getWeb3Status()}
      <WalletModal ENSName={ENSName} pendingTransactions={pending} confirmedTransactions={confirmed} />
    </>
  )
}
