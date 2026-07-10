/**
 * Mock Razorpay Payment Handler
 * Simulates Razorpay checkout without needing real API keys
 */

export const loadMockRazorpay = () => {
  return new Promise((resolve) => {
    // Simulate Razorpay script loading
    setTimeout(() => {
      window.Razorpay = MockRazorpay;
      resolve(true);
    }, 500);
  });
};

class MockRazorpay {
  constructor(options) {
    this.options = options;
  }

  open() {
    console.log("[Mock Payment] Opening mock payment dialog...");
    
    // Create mock payment modal
    const modal = this.createMockModal();
    document.body.appendChild(modal);

    let isHandled = false; // Flag to prevent double handling

    // Auto-success after 2 seconds or on button click
    const handleSuccess = () => {
      if (isHandled) return; // Prevent double execution
      isHandled = true;

      const mockPaymentId = `pay_mock_${Date.now()}`;
      const mockSignature = `mock_sig_${Date.now()}`;

      console.log("[Mock Payment] Payment successful!");

      // Clean up modal safely
      if (modal.parentNode) {
        document.body.removeChild(modal);
      }

      // Call success handler
      if (this.options.handler) {
        this.options.handler({
          razorpay_payment_id: mockPaymentId,
          razorpay_order_id: this.options.order_id,
          razorpay_signature: mockSignature,
        });
      }
    };

    const handleFailure = () => {
      if (isHandled) return; // Prevent double execution
      isHandled = true;

      console.log("[Mock Payment] Payment cancelled");
      
      // Clean up modal safely
      if (modal.parentNode) {
        document.body.removeChild(modal);
      }
      
      if (this.options.modal?.ondismiss) {
        this.options.modal.ondismiss();
      }
    };

    // Add event listeners
    const successBtn = modal.querySelector("#mock-pay-success");
    const cancelBtn = modal.querySelector("#mock-pay-cancel");
    
    if (successBtn) {
      successBtn.addEventListener("click", handleSuccess);
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener("click", handleFailure);
    }
    
    // Auto-success in 3 seconds (for demo purposes)
    // Remove this if you want manual confirmation only
    const autoSuccessTimeout = setTimeout(handleSuccess, 3000);
    
    // Clear timeout if user clicks manually
    if (successBtn) {
      successBtn.addEventListener("click", () => clearTimeout(autoSuccessTimeout), { once: true });
    }
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => clearTimeout(autoSuccessTimeout), { once: true });
    }
  }

  createMockModal() {
    const modal = document.createElement("div");
    modal.id = "mock-razorpay-modal";
    modal.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
          max-width: 450px;
          width: 90%;
          text-align: center;
        ">
          <div style="
            width: 60px;
            height: 60px;
            background: #528FF0;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          
          <h2 style="margin: 0 0 10px; color: #333; font-size: 24px; font-weight: 600;">
            Mock Payment Gateway
          </h2>
          
          <p style="margin: 0 0 10px; color: #666; font-size: 14px;">
            Development Mode - No real payment required
          </p>
          
          <p style="margin: 0 0 30px; color: #888; font-size: 13px;">
            Amount: ₹${(this.options.amount / 100).toFixed(2)}
          </p>
          
          <div style="
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
          ">
            <p style="margin: 0 0 10px; color: #495057; font-size: 13px; font-weight: 500;">
              This is a simulated payment
            </p>
            <p style="margin: 0; color: #6c757d; font-size: 12px; line-height: 1.5;">
              The payment will be automatically approved in 3 seconds, or click "Pay Now" to proceed immediately.
            </p>
          </div>
          
          <div style="display: flex; gap: 10px;">
            <button id="mock-pay-cancel" style="
              flex: 1;
              padding: 12px 24px;
              background: #6c757d;
              color: white;
              border: none;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: background 0.2s;
            ">
              Cancel
            </button>
            
            <button id="mock-pay-success" style="
              flex: 2;
              padding: 12px 24px;
              background: #528FF0;
              color: white;
              border: none;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: background 0.2s;
            ">
              Pay ₹${(this.options.amount / 100).toFixed(2)}
            </button>
          </div>
          
          <p style="margin: 20px 0 0; color: #adb5bd; font-size: 11px;">
            🔒 Powered by Mock Payment Gateway
          </p>
        </div>
      </div>
    `;

    // Add hover effects
    const style = document.createElement("style");
    style.textContent = `
      #mock-pay-success:hover { background: #3d7dd6 !important; }
      #mock-pay-cancel:hover { background: #5a6268 !important; }
    `;
    modal.appendChild(style);

    return modal;
  }
}

export default MockRazorpay;
