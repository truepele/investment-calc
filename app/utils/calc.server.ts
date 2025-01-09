// app/utils/calc.server.ts
// (Everything here runs on the server - so you can import from "@remix-run/cloudflare" if needed.)

/** Calculates property transfer tax using threshold logic. */
export function calculatePropertyTransferTax(
    purchasePrice: number,
    pttThreshold: number,
    pttRateUntilThreshold: number,
    pttRateAboveThreshold: number
  ) {
    if (purchasePrice <= pttThreshold) {
      return purchasePrice * pttRateUntilThreshold;
    } else {
      const taxUntilThreshold = pttThreshold * pttRateUntilThreshold;
      const taxAboveThreshold = (purchasePrice - pttThreshold) * pttRateAboveThreshold;
      return taxUntilThreshold + taxAboveThreshold;
    }
  }
  
  /** Calculates realtor fee on sale using threshold logic. */
  export function calculateRealtorFeeOnSale(
    sellingPrice: number,
    realtorThreshold: number,
    realtorRateUntilThreshold: number,
    realtorRateAboveThreshold: number
  ) {
    if (sellingPrice <= realtorThreshold) {
      return sellingPrice * realtorRateUntilThreshold;
    } else {
      const feeUntilThreshold = realtorThreshold * realtorRateUntilThreshold;
      const feeAboveThreshold =
        (sellingPrice - realtorThreshold) * realtorRateAboveThreshold;
      return feeUntilThreshold + feeAboveThreshold;
    }
  }
  
  /** Gets the fixed monthly mortgage payment for a standard amortizing mortgage. */
  export function getMonthlyMortgagePayment(
    principal: number,
    annualInterestRate: number,
    amortizationYears: number
  ) {
    const monthlyInterestRate = annualInterestRate / 12.0;
    const totalPayments = amortizationYears * 12;
  
    if (monthlyInterestRate === 0) {
      // Edge case: zero interest
      return principal / totalPayments;
    }
  
    return (
      (principal * monthlyInterestRate) /
      (1 - Math.pow(1 + monthlyInterestRate, -totalPayments))
    );
  }
  
  /** Returns (monthlyPayment, totalInterestPaid, principalPaid) after holding X years. */
  export function calculateMortgageInterestTotal(
    principal: number,
    annualInterestRate: number,
    amortizationYears: number,
    yearsBeforeSelling: number
  ) {
    const monthlyPayment = getMonthlyMortgagePayment(
      principal,
      annualInterestRate,
      amortizationYears
    );
  
    const monthlyInterestRate = annualInterestRate / 12.0;
    const monthsBeforeSelling = yearsBeforeSelling * 12;
  
    let totalInterestPaid = 0.0;
    let currentBalance = principal;
  
    for (let i = 0; i < monthsBeforeSelling; i++) {
      if (currentBalance <= 0) break; // loan fully paid off
  
      const interestForMonth = currentBalance * monthlyInterestRate;
      let principalForMonth = monthlyPayment - interestForMonth;
  
      if (principalForMonth > currentBalance) {
        principalForMonth = currentBalance;
      }
  
      totalInterestPaid += interestForMonth;
      currentBalance -= principalForMonth;
    }
  
    const principalPaid = principal - currentBalance;
    return { monthlyPayment, totalInterestPaid, principalPaid };
  }
  
  /** 
   * Helper function that reads form fields, performs all calculations, 
   * and returns a results object for the route action.
   */
  export function runInvestmentCalculations(formData: FormData) {
    function f(field: string) {
      return parseFloat(formData.get(field)?.toString() || "0");
    }
  
    const inflationRate = f("inflation_rate");
    const yearlyAppreciationRate = f("yearly_appreciation_rate");
    const developmentYears = f("development_years");
    const rentYears = f("rent_years");
    const amortizationYears = f("amortization_years");
    const mortgageRate = f("mortgage_rate");
  
    const realtorFeeRateThreshold = f("realtor_fee_rate_threshold");
    const realtorFeeRateUntilThreshold = f("realtor_fee_rate_until_threshold");
    const realtorFeeRateAboveThreshold = f("realtor_fee_rate_above_threshold");
  
    const propertyTransferTaxRateThreshold = f("property_transfer_tax_rate_threshold");
    const propertyTransferTaxRateUntilThreshold = f("property_transfer_tax_rate_until_threshold");
    const propertyTransferTaxRateAboveThreshold = f("property_transfer_tax_rate_above_threshold");
  
    const marginalTaxRate = f("marginal_tax_rate");
    const startingRentPerMonth = f("starting_rent_per_month");
    const purchasePriceListing = f("purchase_price_listing");
    const downpaymentPercent = f("downpayment_percent");
  
    const closingLegalNotaryFees = f("closing_legal_notary_fees");
    const sellingLegalNotaryFees = f("selling_legal_notary_fees");
  
    const maintenanceRepairsMonthly = f("maintenance_repairs_monthly");
    const strataFeeMonthly = f("strata_fee_monthly");
    const insuranceMonthly = f("insurance_monthly");
    const gstRate = f("gst_rate");
    const propertyTaxYearly = f("property_tax_yearly");
  
    // 3.1
    const gstOnPurchase = purchasePriceListing * gstRate;
    const totalPurchasePriceWithGst = purchasePriceListing + gstOnPurchase;
  
    // 3.2
    const downpayment = totalPurchasePriceWithGst * downpaymentPercent;
  
    // 3.3
    const mortgageAmount = totalPurchasePriceWithGst - downpayment;
  
    // 3.4
    const totalInvestmentYears = developmentYears + rentYears;
    const sellPrice =
      purchasePriceListing * Math.pow(1 + yearlyAppreciationRate, totalInvestmentYears);
  
    // 3.5
    const propertyTransferTax = calculatePropertyTransferTax(
      purchasePriceListing,
      propertyTransferTaxRateThreshold,
      propertyTransferTaxRateUntilThreshold,
      propertyTransferTaxRateAboveThreshold
    );
    const totalClosingCosts = closingLegalNotaryFees + propertyTransferTax;
  
    // 3.6
    const adjustedCostBase = totalPurchasePriceWithGst + totalClosingCosts;
  
    // 3.8.5 Mortgage interest total
    const { monthlyPayment, totalInterestPaid, principalPaid } =
      calculateMortgageInterestTotal(
        mortgageAmount,
        mortgageRate,
        amortizationYears,
        rentYears
      );
    const remainingPrincipal = mortgageAmount - principalPaid;
  
    // 3.7
    const realtorFeeOnSale = calculateRealtorFeeOnSale(
      sellPrice,
      realtorFeeRateThreshold,
      realtorFeeRateUntilThreshold,
      realtorFeeRateAboveThreshold
    );
    const sellingLegalNotary = sellingLegalNotaryFees;
    const varMortgageTermination = monthlyPayment * 2 * 0.7;
    const totalSellingCosts = realtorFeeOnSale + sellingLegalNotary + varMortgageTermination;
  
    // 3.8
    const oneTimeRentRealtorFee = startingRentPerMonth * 0.5;
    const maintenanceRepairsTotal = maintenanceRepairsMonthly * 12 * rentYears;
    const strataFeeTotal = strataFeeMonthly * 12 * rentYears;
    const insuranceTotal = insuranceMonthly * 12 * rentYears;
    const propertyTaxTotal = propertyTaxYearly * rentYears;
  
    // 3.9 (simple approach)
    const grossRentalIncomeTotal = startingRentPerMonth * 12 * rentYears;
  
    // 3.10
    const totalOwningCostsDuringRent =
      oneTimeRentRealtorFee +
      maintenanceRepairsTotal +
      strataFeeTotal +
      insuranceTotal +
      totalInterestPaid +
      propertyTaxTotal;
  
    const netRentalIncomeTotal = grossRentalIncomeTotal - totalOwningCostsDuringRent;
  
    // 3.11
    const capitalGain = sellPrice - totalSellingCosts - adjustedCostBase;
  
    // 3.12
    const netCapitalGainAfterTax = capitalGain - (capitalGain / 2) * marginalTaxRate;
  
    // 3.13
    const investedAmount = downpayment + totalClosingCosts;
  
    // 3.14
    const netProfit = netCapitalGainAfterTax + netRentalIncomeTotal;
  
    // 3.15
    const inflationFactor = Math.pow(1 + inflationRate, totalInvestmentYears);
    const inflationAdjustedNetProfit = netProfit / inflationFactor;
  
    // 3.16
    const roiRate = netProfit / investedAmount;
  
    // 3.17
    const inflationAdjustedRoiRate = inflationAdjustedNetProfit / investedAmount;
  
    // 3.18
    let avgYearlyRoiRate = 0;
    if (totalInvestmentYears > 0) {
      avgYearlyRoiRate = Math.pow(1 + roiRate, 1 / totalInvestmentYears) - 1;
    }
  
    // 3.19
    let inflationAdjustedAvgYearlyRoiRate = 0;
    if (totalInvestmentYears > 0) {
      inflationAdjustedAvgYearlyRoiRate =
        Math.pow(1 + inflationAdjustedRoiRate, 1 / totalInvestmentYears) - 1;
    }
  
    return {
      purchasePriceListing,
      totalPurchasePriceWithGst,
      downpayment,
      mortgageAmount,
      monthlyPayment,
      totalInterestPaid,
      sellPrice,
      totalClosingCosts,
      propertyTransferTax,
      closingLegalNotaryFees,
      adjustedCostBase,
      totalSellingCosts,
      realtorFeeOnSale,
      sellingLegalNotary,
      varMortgageTermination,
      oneTimeRentRealtorFee,
      maintenanceRepairsTotal,
      strataFeeTotal,
      insuranceTotal,
      propertyTaxTotal,
      grossRentalIncomeTotal,
      netRentalIncomeTotal,
      capitalGain,
      netCapitalGainAfterTax,
      investedAmount,
      netProfit,
      inflationAdjustedNetProfit,
      roiRate,
      inflationAdjustedRoiRate,
      avgYearlyRoiRate,
      inflationAdjustedAvgYearlyRoiRate,
      principalPaid,
      remainingPrincipal
    };
  }
  