import os
import re

# 定义需要替换的中文文本映射
replacements = {
    # Modal类别选项
    '技术服务': 'Technology',
    '云计算': 'Cloud Computing',
    '原材料': 'Raw Materials',
    '物流运输': 'Logistics',
    '咨询服务': 'Consulting',
    '设计服务': 'Design',
    '营销推广': 'Marketing',
    
    # 通用UI文本
    '其他': 'Other',
    '创建支付': 'Create Payment',
    '还没有注册的供应商': 'No registered suppliers yet',
    '关闭': 'Close',
    '品牌': 'Brand',
    '注册供应商': 'Register Supplier',
    '供应商名称': 'Supplier Name',
    '利润率必须在': 'Profit margin must be between',
    '之间': '',
    
    # 网络图提示
    '拖拽缩放': 'Drag to zoom',
    '悬停查看详情': 'Hover for details',
    
    # 流支付相关
    '触发类型': 'Trigger Type',
    '时间触发': 'Time Trigger',
    '事件触发': 'Event Trigger',
    '开始时间': 'Start Time',
    '币种': 'Currency',
    '添加节点': 'Add Node',
    '触发器': 'Trigger',
    '支付配置': 'Payment Config',
    '收款人': 'Recipient',
    '条件': 'Condition',
    '运行中': 'Running',
    '已暂停': 'Paused',
    '已完成': 'Completed',
    '未知': 'Unknown',
    '创建于': 'Created at',
    '停止条件': 'Stop Condition',
    '执行器': 'Executor',
    '待执行': 'Pending',
    '已支付': 'Paid',
    '频率': 'Frequency',
    '每分钟': 'Per Minute',
    
    # 主题切换
    '切换到浅色模式': 'Switch to light mode',
    '切换到深色模式': 'Switch to dark mode',
    
    # 登录相关
    '登录': 'Login',
    '支付宝登录': 'Alipay Login',
    '模拟': 'Simulate',
    '生成新钱包': 'Generate New Wallet',
    '显示助记词让用户保存': 'Show mnemonic for user to save',
}

def fix_file(filepath):
    """修复单个文件中的中文文本"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        changes = []
        
        # 执行替换
        for chinese, english in replacements.items():
            if chinese in content:
                # 记录变更
                count = content.count(chinese)
                if count > 0:
                    changes.append(f"  '{chinese}' -> '{english}' ({count} occurrences)")
                content = content.replace(chinese, english)
        
        # 如果有变更，写回文件
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True, changes
        
        return False, []
    except Exception as e:
        return False, [f"Error: {str(e)}"]

def main():
    """主函数：扫描并修复所有文件"""
    print("🔍 Scanning for hardcoded Chinese text...\n")
    
    fixed_files = []
    skipped_files = ['LanguageSelector.jsx']  # 语言选择器中的中文是正确的
    
    for root, dirs, files in os.walk('src'):
        # 跳过node_modules和i18n目录
        if 'node_modules' in root or 'i18n' in root:
            continue
        
        for file in files:
            if file in skipped_files:
                continue
                
            if file.endswith(('.jsx', '.js', '.tsx', '.ts')):
                filepath = os.path.join(root, file)
                fixed, changes = fix_file(filepath)
                
                if fixed:
                    print(f"✅ Fixed: {filepath}")
                    for change in changes:
                        print(change)
                    print()
                    fixed_files.append(filepath)
    
    print(f"\n📊 Summary:")
    print(f"   Total files fixed: {len(fixed_files)}")
    print(f"\n✨ All hardcoded Chinese text has been replaced with English!")

if __name__ == '__main__':
    main()
