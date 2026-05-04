import { CustomBottomSheet } from '@/src/navigation/CustomBottomSheet'
import { Stack } from 'expo-router'
import React from 'react'

export default function HomeLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <CustomBottomSheet />
    </>
  )
}
