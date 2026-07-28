export type SePayCheckoutFields = Record<string, string | number | boolean>;

export type SePayCheckoutPayload = {
  checkoutUrl: string;
  checkoutFields: SePayCheckoutFields;
};

export function submitSePayCheckout({
  checkoutUrl,
  checkoutFields,
}: SePayCheckoutPayload) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = checkoutUrl;
  form.style.display = "none";

  Object.entries(checkoutFields).forEach(([name, rawValue]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = String(rawValue);
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}
