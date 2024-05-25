import React, { createContext, useContext, ReactNode, useRef } from 'react'
import BottomSheet from '@gorhom/bottom-sheet'

type BottomSheetContextType = React.RefObject<BottomSheet> | null
const BottomSheetContext = createContext<BottomSheetContextType>(null)

export const useBottomSheet = (): BottomSheetContextType => useContext(BottomSheetContext)

interface BottomSheetProviderProps {
  children: ReactNode
}

export const BottomSheetProvider = ({ children }: BottomSheetProviderProps) => {
  const sheetRef = useRef<BottomSheet>(null)
  return <BottomSheetContext.Provider value={sheetRef}>{children}</BottomSheetContext.Provider>
}
