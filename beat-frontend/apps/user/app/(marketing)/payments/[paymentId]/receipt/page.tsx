import { PaymentReceipt } from '@/components/PaymentReceipt/PaymentReceipt'
import { PAGE_METADATA } from '@/constants'
import { createPageMetadata } from '@/lib'

type PaymentReceiptPageProps = {
  params: { paymentId: string }
}

export const metadata = createPageMetadata(
  PAGE_METADATA.PAYMENT_RECEIPT.title,
  PAGE_METADATA.PAYMENT_RECEIPT.description
)

export default function PaymentReceiptPage({ params }: PaymentReceiptPageProps) {
  return <PaymentReceipt paymentId={params.paymentId} />
}
