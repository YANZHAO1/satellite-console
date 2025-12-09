import { describe, it, expect } from 'vitest';
import { serialize, serializeArgs } from './serializer';

describe('Serializer', () => {
  describe('基础类型序列化', () => {
    it('应该序列化字符串', () => {
      const result = serialize('hello');
      expect(result).toEqual({ type: 'string', value: 'hello' });
    });

    it('应该序列化数字', () => {
      const result = serialize(42);
      expect(result).toEqual({ type: 'number', value: 42 });
    });

    it('应该序列化布尔值', () => {
      const result = serialize(true);
      expect(result).toEqual({ type: 'boolean', value: true });
    });

    it('应该序列化 null', () => {
      const result = serialize(null);
      expect(result).toEqual({ type: 'null', value: null });
    });

    it('应该序列化 undefined', () => {
      const result = serialize(undefined);
      expect(result).toEqual({ type: 'undefined', value: undefined });
    });
  });

  describe('字符串截断', () => {
    it('应该截断超长字符串', () => {
      const longString = 'a'.repeat(1500);
      const result = serialize(longString, { maxStringLength: 1000 });
      expect(result.type).toBe('string');
      if (result.type === 'string') {
        expect(result.value).toContain('truncated');
        expect(result.value).toContain('total length: 1500');
      }
    });

    it('不应该截断短字符串', () => {
      const shortString = 'hello world';
      const result = serialize(shortString, { maxStringLength: 1000 });
      expect(result).toEqual({ type: 'string', value: 'hello world' });
    });
  });

  describe('函数序列化', () => {
    it('应该序列化函数', () => {
      const fn = function test() { return 42; };
      const result = serialize(fn);
      expect(result.type).toBe('function');
      if (result.type === 'function') {
        expect(result.value).toContain('function');
      }
    });

    it('应该序列化箭头函数', () => {
      const fn = () => 42;
      const result = serialize(fn);
      expect(result.type).toBe('function');
      if (result.type === 'function') {
        expect(result.value).toBeTruthy();
      }
    });
  });

  describe('Error 对象序列化', () => {
    it('应该序列化 Error 对象', () => {
      const error = new Error('Test error');
      const result = serialize(error);
      expect(result.type).toBe('error');
      if (result.type === 'error') {
        expect(result.message).toBe('Test error');
        expect(result.stack).toBeDefined();
      }
    });
  });

  describe('数组序列化', () => {
    it('应该序列化简单数组', () => {
      const arr = [1, 2, 3];
      const result = serialize(arr);
      expect(result.type).toBe('array');
      if (result.type === 'array') {
        expect(result.value).toHaveLength(3);
        expect(result.preview).toContain('Array(3)');
      }
    });

    it('应该限制数组长度', () => {
      const arr = Array.from({ length: 150 }, (_, i) => i);
      const result = serialize(arr, { maxArrayLength: 100 });
      expect(result.type).toBe('array');
      if (result.type === 'array') {
        expect(result.value).toHaveLength(100);
        expect(result.preview).toContain('showing first 100 items');
      }
    });

    it('应该递归序列化数组元素', () => {
      const arr = [1, 'hello', { key: 'value' }];
      const result = serialize(arr);
      expect(result.type).toBe('array');
      if (result.type === 'array') {
        expect(result.value[0]).toEqual({ type: 'number', value: 1 });
        expect(result.value[1]).toEqual({ type: 'string', value: 'hello' });
        expect(result.value[2].type).toBe('object');
      }
    });
  });

  describe('对象序列化', () => {
    it('应该序列化简单对象', () => {
      const obj = { name: 'test', age: 30 };
      const result = serialize(obj);
      expect(result.type).toBe('object');
      if (result.type === 'object') {
        expect(result.value.name).toEqual({ type: 'string', value: 'test' });
        expect(result.value.age).toEqual({ type: 'number', value: 30 });
      }
    });

    it('应该生成对象预览', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = serialize(obj);
      expect(result.type).toBe('object');
      if (result.type === 'object') {
        expect(result.preview).toContain('Object');
      }
    });

    it('应该递归序列化嵌套对象', () => {
      const obj = {
        user: {
          name: 'John',
          address: {
            city: 'NYC'
          }
        }
      };
      const result = serialize(obj);
      expect(result.type).toBe('object');
      if (result.type === 'object') {
        expect(result.value.user.type).toBe('object');
      }
    });
  });

  describe('循环引用检测', () => {
    it('应该检测对象的循环引用', () => {
      const obj: any = { name: 'test' };
      obj.self = obj;
      
      const result = serialize(obj);
      expect(result.type).toBe('object');
      if (result.type === 'object') {
        expect(result.value.self).toEqual({ type: 'string', value: '[Circular]' });
      }
    });

    it('应该检测数组的循环引用', () => {
      const arr: any[] = [1, 2];
      arr.push(arr);
      
      const result = serialize(arr);
      expect(result.type).toBe('array');
      if (result.type === 'array') {
        expect(result.value[2]).toEqual({ type: 'string', value: '[Circular]' });
      }
    });

    it('应该检测深层循环引用', () => {
      const obj: any = { level1: { level2: {} } };
      obj.level1.level2.back = obj;
      
      const result = serialize(obj);
      expect(result.type).toBe('object');
      if (result.type === 'object') {
        const level1 = result.value.level1;
        if (level1.type === 'object') {
          const level2 = level1.value.level2;
          if (level2.type === 'object') {
            expect(level2.value.back).toEqual({ type: 'string', value: '[Circular]' });
          }
        }
      }
    });
  });

  describe('深度限制', () => {
    it('应该限制序列化深度', () => {
      const obj = {
        level1: {
          level2: {
            level3: {
              level4: 'too deep'
            }
          }
        }
      };
      
      const result = serialize(obj, { maxDepth: 3 });
      expect(result.type).toBe('object');
      if (result.type === 'object') {
        const level1 = result.value.level1;
        if (level1.type === 'object') {
          const level2 = level1.value.level2;
          if (level2.type === 'object') {
            const level3 = level2.value.level3;
            expect(level3).toEqual({ type: 'string', value: '[Max Depth Reached]' });
          }
        }
      }
    });

    it('应该在达到深度限制时停止', () => {
      const obj = { a: { b: { c: { d: 'value' } } } };
      const result = serialize(obj, { maxDepth: 2 });
      
      expect(result.type).toBe('object');
      if (result.type === 'object') {
        const levelA = result.value.a;
        if (levelA.type === 'object') {
          const levelB = levelA.value.b;
          expect(levelB).toEqual({ type: 'string', value: '[Max Depth Reached]' });
        }
      }
    });
  });

  describe('serializeArgs', () => {
    it('应该序列化多个参数', () => {
      const args = [1, 'hello', { key: 'value' }];
      const result = serializeArgs(args);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ type: 'number', value: 1 });
      expect(result[1]).toEqual({ type: 'string', value: 'hello' });
      expect(result[2].type).toBe('object');
    });

    it('应该处理空参数数组', () => {
      const result = serializeArgs([]);
      expect(result).toEqual([]);
    });

    it('应该使用自定义配置', () => {
      const longString = 'a'.repeat(500);
      const result = serializeArgs([longString], { maxStringLength: 100 });
      
      expect(result[0].type).toBe('string');
      if (result[0].type === 'string') {
        expect(result[0].value).toContain('truncated');
      }
    });
  });

  describe('边界情况', () => {
    it('应该处理空对象', () => {
      const result = serialize({});
      expect(result.type).toBe('object');
      if (result.type === 'object') {
        expect(result.value).toEqual({});
      }
    });

    it('应该处理空数组', () => {
      const result = serialize([]);
      expect(result.type).toBe('array');
      if (result.type === 'array') {
        expect(result.value).toEqual([]);
      }
    });

    it('应该处理包含特殊值的数组', () => {
      const arr = [null, undefined, NaN, Infinity];
      const result = serialize(arr);
      expect(result.type).toBe('array');
      if (result.type === 'array') {
        expect(result.value[0]).toEqual({ type: 'null', value: null });
        expect(result.value[1]).toEqual({ type: 'undefined', value: undefined });
      }
    });

    it('应该处理混合类型的对象', () => {
      const obj = {
        str: 'text',
        num: 42,
        bool: true,
        nil: null,
        undef: undefined,
        arr: [1, 2],
        nested: { key: 'value' }
      };
      
      const result = serialize(obj);
      expect(result.type).toBe('object');
      if (result.type === 'object') {
        expect(Object.keys(result.value)).toHaveLength(7);
      }
    });
  });
});
