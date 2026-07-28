export const getTranslation = (key: string, language: string): string => {
  if (language === 'vi') {
    switch (key) {
      case 'GREAT_DEAL': return 'Giá Tốt';
      case 'BEST_OVERALL': return 'Tốt nhất';
      case 'CHEAPEST': return 'Rẻ nhất';
      case 'BEST_TIME': return 'Giờ đẹp';
      case 'UPGRADE_FOR_MORE': return 'Nâng cấp để tìm kiếm xa hơn.';
      case 'CHECK_FLIGHTS': return 'Xem chuyến bay';
      case 'NON_STOP': return 'Bay thẳng';
      case 'STOPS': return 'điểm dừng';
      default: return key;
    }
  }
  
  // Default english fallback
  switch (key) {
    case 'GREAT_DEAL': return 'Great Deal';
    case 'BEST_OVERALL': return 'Best overall';
    case 'CHEAPEST': return 'Cheapest';
    case 'BEST_TIME': return 'Best time';
    case 'UPGRADE_FOR_MORE': return 'You can upgrade to search further ahead.';
    case 'CHECK_FLIGHTS': return 'Check flights';
    case 'NON_STOP': return 'Non-stop';
    case 'STOPS': return 'stops';
    default: return key;
  }
};
