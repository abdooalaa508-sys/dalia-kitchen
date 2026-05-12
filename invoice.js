function printReceipt(cart, userDetails, discountValue, total, deliveryFee) {
    if (cart.length === 0) return alert('السلة فاضية!');

    const printWindow = window.open('', '', 'width=600,height=800');

    // Formatting date
    const date = new Date().toLocaleString('ar-EG');

    // Items HTML
    const itemsHtml = cart.map(item => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px;">${item.name}</td>
            <td style="padding: 10px;">${item.quantity}</td>
            <td style="padding: 10px;">${item.price} ج.م</td>
            <td style="padding: 10px;">${item.price * item.quantity} ج.م</td>
        </tr>
    `).join('');

    const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <title>فاتورة - مطبخ داليا</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Cairo', sans-serif; padding: 20px; text-align: center; }
            .header { margin-bottom: 30px; border-bottom: 2px solid #ccc; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: center; text-align: right; }
            .header-info { flex: 1; }
            .logo { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid #c0392b; margin-right: 20px; }
            h1 { color: #c0392b; margin: 0; font-size: 1.8rem; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f9f9f9; padding: 10px; border-bottom: 2px solid #ddd; }
            .totals { margin-top: 30px; text-align: left; padding-left: 20px; }
            .totals div { font-size: 1.2rem; margin-bottom: 5px; }
            .footer { margin-top: 50px; font-size: 0.8rem; color: #777; border-top: 1px solid #ccc; padding-top: 20px;}
        </style>
    </head>
    <body>
        <div class="header">
            <div class="header-info">
                <h1>مطبخ داليا</h1>
                <p>أكل بيتي ... بطعم زمااااان</p>
                <p>التاريخ: ${date}</p>
            </div>
            <img src="صور/بروفيل_جديد.jpg" class="logo" alt="Logo">
        </div>

        <div style="text-align: right; margin-bottom: 20px;">
            <h3>بيانات العميل:</h3>
            <p><strong>الاسم/التليفون:</strong> ${userDetails.phone}</p>
            <p><strong>العنوان:</strong> ${userDetails.address || 'استلام من المطبخ'}</p>
        </div>

        <table>
            <thead>
                <tr>
                    <th>المنتج</th>
                    <th>العدد</th>
                    <th>السعر</th>
                    <th>الإجمالي</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>

        <div class="totals">
            <p><strong>الخصم:</strong> ${discountValue} ج.م</p>
            ${(deliveryFee && deliveryFee > 0) ? `<p style="color: #e67e22;"><strong>🚚 رسوم التوصيل:</strong> +${deliveryFee} ج.م</p>` : ''}
            <p style="font-size: 1.5rem; color: #c0392b;"><strong>الإجمالي النهائي: ${total} ج.م</strong></p>
        </div>

        <div class="footer">
            <p>شكراً لطلبك من مطبخ داليا!</p>
            <p>للتواصل: 01155050300</p>
        </div>
        
        <script>
            window.print();
        </script>
    </body>
    </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
}
