import { useTranslation } from 'react-i18next'
import { Modal as RNModal, Pressable, Text, View } from 'react-native'

import { MODAL_STYLES as styles } from '@/components/ui/Modal/Modal.style'
import type { IModalProps } from '@/components/ui/Modal/Modal.type'

export const Modal = ({
  children,
  isOpen,
  onClose,
  title
}: IModalProps) => {
  const { t } = useTranslation()

  return (
    <RNModal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={isOpen}
    >
      <View style={styles.viewport}>
        <Pressable onPress={onClose} style={styles.scrim} />
        <Pressable onPress={() => undefined} style={styles.panel}>
          <View style={styles.grabber} />
          <View style={styles.header}>
            {title !== undefined && (
              <Text style={styles.title}>{title}</Text>
            )}
            <Pressable
              accessibilityLabel={t('components.modal.close')}
              accessibilityRole="button"
              onPress={onClose}
              style={styles.closePressable}
            >
              <Text style={styles.closeGlyph}>✕</Text>
            </Pressable>
          </View>
          {children}
        </Pressable>
      </View>
    </RNModal>
  )
}
