function badRequest(msg) {
  const err = new Error(msg);
  err.status = 400;
  err.name = 'BadRequest';
  return err;
}

function conflict(msg) {
  const err = new Error(msg);
  err.status = 409;
  err.name = 'Conflict';
  return err;
}

function toMeters(value, unit) {
  if (unit === 'CM') return value / 100;
  if (unit === 'MM') return value / 1000;
  throw badRequest('Invalid dimension unit');
}

export function calculateItemPrice({ product, selectedOptions, width, height, quantity }) {
  if (!product.active) throw badRequest('Product inactive');

  // QUOTE: não permite checkout automático
  if (product.pricingModel === 'QUOTE') {
    throw conflict('This product requires a quote');
  }

  // Helpers
  const unit = product.dimensionUnit;
  const step = product.step ?? null;

  // Validação de dimensões
  const needsDims = product.pricingModel === 'AREA_M2' || product.pricingModel === 'LINEAR_M';
  if (needsDims) {
    if (!width || width <= 0) throw badRequest('width is required');
    if (product.pricingModel === 'AREA_M2') {
      if (!height || height <= 0) throw badRequest('height is required');
    }
    if (step && width % step !== 0) throw badRequest(`width must respect step=${step}`);
    if (step && height && height % step !== 0) throw badRequest(`height must respect step=${step}`);

    if (product.minWidth && width < product.minWidth) throw badRequest('width below minWidth');
    if (product.maxWidth && width > product.maxWidth) throw badRequest('width above maxWidth');
    if (product.minHeight && height && height < product.minHeight) throw badRequest('height below minHeight');
    if (product.maxHeight && height && height > product.maxHeight) throw badRequest('height above maxHeight');
  }

  // Cálculo base
  let baseCents = 0;
  let areaM2 = 0;

  if (product.pricingModel === 'UNIT') {
    if (product.baseUnitPriceCents == null) throw badRequest('baseUnitPriceCents not set');
    baseCents = product.baseUnitPriceCents;
  }

  if (product.pricingModel === 'AREA_M2') {
    if (product.baseM2PriceCents == null) throw badRequest('baseM2PriceCents not set');

    const wM = toMeters(width, unit);
    const hM = toMeters(height, unit);

    areaM2 = wM * hM;

    // área mínima cobrada
    const billableArea = product.minAreaM2 ? Math.max(areaM2, product.minAreaM2) : areaM2;

    baseCents = Math.round(product.baseM2PriceCents * billableArea);
  }

  if (product.pricingModel === 'LINEAR_M') {
    if (product.baseLinearMPriceCents == null) throw badRequest('baseLinearMPriceCents not set');

    const lengthM = toMeters(width, unit);
    baseCents = Math.round(product.baseLinearMPriceCents * lengthM);
  }

  // Aplicar modificadores de opções
  let subtotal = baseCents;

  for (const opt of selectedOptions) {
    if (!opt.active) continue;

    if (opt.modifierType === 'FIXED_CENTS') {
      subtotal += opt.modifierValue;
      continue;
    }

    if (opt.modifierType === 'PER_M2_CENTS') {
      if (product.pricingModel !== 'AREA_M2') {
        // regra simples: PER_M2 só faz sentido em produto por área
        throw badRequest('PER_M2 option used on non AREA_M2 product');
      }
      const wM = toMeters(width, unit);
      const hM = toMeters(height, unit);
      const rawArea = wM * hM;
      const billableArea = product.minAreaM2 ? Math.max(rawArea, product.minAreaM2) : rawArea;

      subtotal += Math.round(opt.modifierValue * billableArea);
      continue;
    }

    if (opt.modifierType === 'PERCENT') {
      subtotal += Math.round(subtotal * (opt.modifierValue / 100));
      continue;
    }
  }

  // Preço mínimo
  if (product.minPriceCents != null) {
    subtotal = Math.max(subtotal, product.minPriceCents);
  }

  // quantidade
  const lineTotal = subtotal * quantity;

  return {
    unitPriceCents: subtotal,
    lineTotalCents: lineTotal,
    computed: {
      areaM2: product.pricingModel === 'AREA_M2' ? areaM2 : null,
    },
  };
}
