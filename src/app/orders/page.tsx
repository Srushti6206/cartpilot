import Link from "next/link";
import { ArrowRight, ClipboardList, ShieldCheck } from "lucide-react";

export default function OrdersPage() {
  return (
    <div className="page-width orders-page">
      <div className="route-heading">
        <div>
          <div className="section-eyebrow"><ClipboardList size={13} aria-hidden="true" /> YOUR SHOPPING, AT A GLANCE</div>
          <h1>Order <em>history.</em></h1>
          <p>A clear record of what you’ve chosen, with payment status you can trust.</p>
        </div>
      </div>

      <div className="orders-empty">
        <span className="orders-empty-icon"><ClipboardList size={25} aria-hidden="true" /></span>
        <span className="orders-empty-kicker">NOTHING HERE JUST YET</span>
        <h2>Your orders will show up here.</h2>
        <p>There are no verified orders in this demo. Order history will only show purchases after PayPal Sandbox capture is connected and confirmed.</p>
        <div className="order-status-note"><ShieldCheck size={15} aria-hidden="true" /> No sample or unverified payments are shown as completed.</div>
        <Link className="button-dark" href="/">Back to Discover <ArrowRight size={15} aria-hidden="true" /></Link>
      </div>
    </div>
  );
}
