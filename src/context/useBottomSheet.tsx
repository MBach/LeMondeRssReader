import React, { createContext, useContext, useRef, type ReactNode, type RefObject, type FC } from 'react'
import BottomSheet from '@gorhom/bottom-sheet'

type BottomSheetRef = RefObject<BottomSheet | null>
const BottomSheetContext = createContext<BottomSheetRef | null>(null)

export const useBottomSheet = (): BottomSheetRef => {
  const context = useContext(BottomSheetContext)
  if (!context) {
    throw new Error('useBottomSheet must be used within a BottomSheetProvider')
  }
  return context
}

export const BottomSheetProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const sheetRef = useRef<BottomSheet | null>(null)
  return <BottomSheetContext.Provider value={sheetRef}>{children}</BottomSheetContext.Provider>
}
