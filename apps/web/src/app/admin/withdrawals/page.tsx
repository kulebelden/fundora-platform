import { redirect } from 'next/navigation';

/** Withdrawals now live inside Manage audits. */
export default function AdminWithdrawalsRedirect() {
  redirect('/admin/audits');
}
