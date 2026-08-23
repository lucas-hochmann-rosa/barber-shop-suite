package br.com.barbershop.ui.support;

import java.awt.Color;
import java.awt.Component;
import javax.swing.JTable;
import javax.swing.table.DefaultTableCellRenderer;

/**
 * Renderizador simples para tabelas sem classificação RF11: mantém linhas
 * alternadas para leitura rápida sem competir com seleção/foco do Swing.
 */
public class ZebraTableRenderer extends DefaultTableCellRenderer {
    private static final Color COR_PAR = UIUtil.COLOR_BRANCO;
    private static final Color COR_IMPAR = new Color(0xF8, 0xFA, 0xF9);

    @Override
    public Component getTableCellRendererComponent(JTable table, Object value, boolean isSelected,
                                                   boolean hasFocus, int row, int column) {
        Component c = super.getTableCellRendererComponent(table, value, isSelected, hasFocus, row, column);
        if (!isSelected) {
            c.setBackground(row % 2 == 0 ? COR_PAR : COR_IMPAR);
            c.setForeground(UIUtil.COLOR_TINTA);
        }
        return c;
    }
}
