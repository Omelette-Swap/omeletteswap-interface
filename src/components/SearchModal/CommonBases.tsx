import React, { useContext } from 'react'
import { Text } from 'rebass'
import { ChainId, Currency, currencyEquals, OMC, Token } from '@uniswap/sdk'
import styled from 'styled-components'

import { SUGGESTED_BASES } from '../../constants'
import { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import { AutoRow } from '../Row'
import CurrencyLogo from '../CurrencyLogo'
import { ThemeContext } from 'styled-components'

const BaseWrapper = styled.div<{ disable?: boolean }>`
  border: 1px solid ${({ theme, disable }) => (disable ? 'transparent' : theme.bg3)};
  border-radius: 10px;
  display: flex;
  padding: 6px;

  align-items: center;
  :hover {
    cursor: ${({ disable }) => !disable && 'pointer'};
    background-color: ${({ theme, disable }) => !disable && theme.bg2};
  }

  background-color: ${({ theme, disable }) => disable && theme.bg3};
  opacity: ${({ disable }) => disable && '0.4'};
`

export default function CommonBases({
  chainId,
  onSelect,
  selectedCurrency
}: {
  chainId?: ChainId
  selectedCurrency?: Currency
  onSelect: (currency: Currency) => void
}) {
  const theme = useContext(ThemeContext)
  return (
    <AutoColumn gap="md">
      <AutoRow>
        <Text fontWeight={500} fontSize={14} color={theme.text2}>
          Common bases
        </Text>
        <QuestionHelper text="These tokens are commonly paired with other tokens." />
      </AutoRow>
      <AutoRow gap="4px">
        <BaseWrapper
          onClick={() => !currencyEquals(selectedCurrency, OMC) && onSelect(OMC)}
          disable={selectedCurrency === OMC}
        >
          <CurrencyLogo currency={OMC} style={{ marginRight: 8 }} />
          <Text fontWeight={500} fontSize={16} color={theme.text2}>
            OMC
          </Text>
        </BaseWrapper>
        {(chainId ? SUGGESTED_BASES[chainId] : []).map((token: Token) => {
          const selected = selectedCurrency instanceof Token && selectedCurrency.address === token.address
          return (
            <BaseWrapper onClick={() => !selected && onSelect(token)} disable={selected} key={token.address}>
              <CurrencyLogo currency={token} style={{ marginRight: 8 }} />
              <Text fontWeight={500} fontSize={16} color={theme.text2}>
                {token.symbol}
              </Text>
            </BaseWrapper>
          )
        })}
      </AutoRow>
    </AutoColumn>
  )
}
