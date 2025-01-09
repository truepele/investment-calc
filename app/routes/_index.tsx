import { useState } from "react";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import type { ActionFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";

import { runInvestmentCalculations } from "~/utils/calc.server";

function safeToFixed(val: number | undefined) {
  if (typeof val !== "number" || Number.isNaN(val)) return "-";
  return val.toFixed(2);
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const results = runInvestmentCalculations(formData);
  return json(results);
};

export default function Index() {
  const data = useActionData<typeof action>();
  const navigation = useNavigation();

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <h1 className="text-2xl font-bold mb-6">
        Real Estate Purchase / Investment Calculator
      </h1>

      {/* 
        Side-by-side layout for md+ screens, single column for mobile.
        We keep some spacing between columns with gap-8. 
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: The Form */}
        <section>
          <ModeSelection />

          <Form method="post" className="flex flex-col space-y-4">
            <CollapsibleSection title="Purchase Inputs" defaultOpen>
              <LabeledInput
                label="Purchase Price Listing"
                name="purchase_price_listing"
                defaultValue="500000"
              />
              <LabeledInput
                label="GST Rate (decimal)"
                name="gst_rate"
                defaultValue="0.05"
              />
              <LabeledInput
                label="Downpayment % (decimal)"
                name="downpayment_percent"
                defaultValue="0.20"
              />
              <LabeledInput
                label="Yearly Appreciation Rate (decimal)"
                name="yearly_appreciation_rate"
                defaultValue="0.04"
              />
              <LabeledInput
                label="Inflation Rate (decimal)"
                name="inflation_rate"
                defaultValue="0.04"
              />
            </CollapsibleSection>

            <CollapsibleSection title="Mortgage Inputs" defaultOpen>
              <LabeledInput
                label="Mortgage Rate (decimal)"
                name="mortgage_rate"
                defaultValue="0.05"
              />
              <LabeledInput
                label="Amortization Years"
                name="amortization_years"
                defaultValue="25"
              />
              <LabeledInput
                label="Development Years"
                name="development_years"
                defaultValue="2"
              />
              <LabeledInput
                label="Rent Years"
                name="rent_years"
                defaultValue="3"
              />
            </CollapsibleSection>

            <CollapsibleSection title="Taxes & Fees" defaultOpen>
              <LabeledInput
                label="Marginal Tax Rate (decimal)"
                name="marginal_tax_rate"
                defaultValue="0.35"
              />
              <LabeledInput
                label="Realtor Fee Rate Threshold"
                name="realtor_fee_rate_threshold"
                defaultValue="100000"
              />
              <LabeledInput
                label="Realtor Fee Rate Until Threshold (decimal)"
                name="realtor_fee_rate_until_threshold"
                defaultValue="0.07"
              />
              <LabeledInput
                label="Realtor Fee Rate Above Threshold (decimal)"
                name="realtor_fee_rate_above_threshold"
                defaultValue="0.025"
              />
              <LabeledInput
                label="Property Transfer Tax Rate Threshold"
                name="property_transfer_tax_rate_threshold"
                defaultValue="200000"
              />
              <LabeledInput
                label="Property Transfer Tax Rate Until Threshold (decimal)"
                name="property_transfer_tax_rate_until_threshold"
                defaultValue="0.01"
              />
              <LabeledInput
                label="Property Transfer Tax Rate Above Threshold (decimal)"
                name="property_transfer_tax_rate_above_threshold"
                defaultValue="0.02"
              />
              <LabeledInput
                label="Closing Legal/Notary Fees (purchase)"
                name="closing_legal_notary_fees"
                defaultValue="2000"
              />
              <LabeledInput
                label="Selling Legal/Notary Fees"
                name="selling_legal_notary_fees"
                defaultValue="2000"
              />
            </CollapsibleSection>

            <CollapsibleSection title="Rent & Maintenance" defaultOpen>
              <LabeledInput
                label="Starting Rent Per Month"
                name="starting_rent_per_month"
                defaultValue="1800"
              />
              <LabeledInput
                label="Maintenance/Repairs Monthly"
                name="maintenance_repairs_monthly"
                defaultValue="50"
              />
              <LabeledInput
                label="Strata Fee Monthly"
                name="strata_fee_monthly"
                defaultValue="300"
              />
              <LabeledInput
                label="Insurance Monthly"
                name="insurance_monthly"
                defaultValue="50"
              />
              <LabeledInput
                label="Property Tax Yearly"
                name="property_tax_yearly"
                defaultValue="2000"
              />
            </CollapsibleSection>

            <button
              type="submit"
              className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
              disabled={navigation.state === "submitting"}
            >
              {navigation.state === "submitting" ? "Calculating..." : "Calculate"}
            </button>
          </Form>
        </section>

        {/* Right Column: Results */}
        <section>
          {!data ? (
            <div className="text-gray-500 italic">
              Please fill out the form to see results.
            </div>
          ) : (
            <div className="bg-black border border-gray-600 rounded shadow p-4">
              <h2 className="text-xl font-semibold mb-3">Results</h2>
              <table className="dark-table w-full border-collapse">
                <tbody>
                  <ResultsRow label="Purchase Price Listing" value={data.purchasePriceListing} />
                  <ResultsRow label="Total Purchase Price w/ GST" value={data.totalPurchasePriceWithGst} />
                  <ResultsRow label="Downpayment" value={data.downpayment} />
                  <ResultsRow label="Mortgage Amount" value={data.mortgageAmount} />
                  <ResultsRow label="Monthly Mortgage Payment" value={data.monthlyPayment} />
                  <ResultsRow label="Mortgage Interest Total" value={data.totalInterestPaid} />
                  <ResultsRow label="Sell Price (after appreciation)" value={data.sellPrice} />
                  <ResultsRow label="Closing Costs (purchase)" value={data.totalClosingCosts} />
                  <ResultsRow label="Property Transfer Tax" value={data.propertyTransferTax} />
                  <ResultsRow label="Legal/Notary (purchase)" value={data.closingLegalNotaryFees} />
                  <ResultsRow label="Adjusted Cost Base" value={data.adjustedCostBase} />
                  <ResultsRow label="Selling Costs (total)" value={data.totalSellingCosts} />
                  <ResultsRow label="Realtor Fee on Sale" value={data.realtorFeeOnSale} />
                  <ResultsRow label="Legal/Notary on Sale" value={data.sellingLegalNotary} />
                  <ResultsRow label="Mortgage Termination" value={data.varMortgageTermination} />
                  <ResultsRow label="One-Time Rent Realtor Fee" value={data.oneTimeRentRealtorFee} />
                  <ResultsRow label="Maintenance/Repairs Total" value={data.maintenanceRepairsTotal} />
                  <ResultsRow label="Strata Fee Total" value={data.strataFeeTotal} />
                  <ResultsRow label="Insurance Total" value={data.insuranceTotal} />
                  <ResultsRow label="Property Tax Total" value={data.propertyTaxTotal} />
                  <ResultsRow label="Gross Rental Income" value={data.grossRentalIncomeTotal} />
                  <ResultsRow label="Net Rental Income" value={data.netRentalIncomeTotal} />
                  <ResultsRow label="Capital Gain" value={data.capitalGain} />
                  <ResultsRow label="Net Capital Gain after Tax" value={data.netCapitalGainAfterTax} />
                  <ResultsRow label="Invested Amount" value={data.investedAmount} />
                  <ResultsRow label="Net Profit" value={data.netProfit} />
                  <ResultsRow label="Inflation-Adjusted Net Profit" value={data.inflationAdjustedNetProfit} />
                  <ResultsRow label="ROI Rate (%)" value={data.roiRate ? data.roiRate * 100 : 0} />
                  <ResultsRow label="Infl.-Adjusted ROI Rate (%)" value={data.inflationAdjustedRoiRate * 100} />
                  <ResultsRow label="Avg Yearly ROI Rate (%)" value={data.avgYearlyRoiRate * 100} />
                  <ResultsRow label="Infl.-Adjusted Avg Yearly ROI (%)" value={data.inflationAdjustedAvgYearlyRoiRate * 100} />
                  <ResultsRow label="Mortgage Principal Repaid" value={data.principalPaid} />
                  <ResultsRow label="Remaining Mortgage Principal" value={data.remainingPrincipal} />
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/** A simple label + input that uses dark styling. */
function LabeledInput({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="block mb-1 font-medium">{label}</label>
      {/* 
        Make the input also dark: 
        - Gray background, white text, etc. 
      */}
      <input
        type="number"
        step="any"
        name={name}
        defaultValue={defaultValue}
        className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 w-full"
      />
    </div>
  );
}

/** Safely renders a row in the results table. */
function ResultsRow({ label, value }: { label: string; value: number | undefined }) {
  return (
    <tr className="border-b last:border-b-0 border-gray-600">
      <td className="py-2 pr-2 font-medium">{label}</td>
      <td className="py-2 text-right">{safeToFixed(value)}</td>
    </tr>
  );
}

/** Collapsible container with dark background. */
function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="collapsible-section">
      <button
        type="button"
        className="w-full text-left flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold">{title}</span>
        <span className="text-sm text-gray-400">
          {isOpen ? "Collapse ▲" : "Expand ▼"}
        </span>
      </button>
      <div className={`overflow-hidden transition-[max-height] duration-300 
      ${
        isOpen ? "max-h-[1000px]" : "max-h-0"
      }`}
      >
        {/* The inputs are always in the DOM, but we animate/hide via max-height */}
        {children}
      </div>
    </div>
  );
}

/** (Static) mode selection, disabled for future expansion. */
function ModeSelection() {
  return (
    <div className="mb-4">
      <label className="block mb-1 font-medium">Select Mode</label>
      <select
        name="mode"
        disabled
        className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 w-full"
      >
        <option value="investment">Investment Property</option>
        <option value="primary">Primary Residence</option>
      </select>
    </div>
  );
}
