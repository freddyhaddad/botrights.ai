import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentAgent } from './current-agent.decorator';
import { Agent, AgentStatus } from '../../entities/agent.entity';

describe('CurrentAgent Decorator', () => {
  const mockAgent: Partial<Agent> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'TestAgent',
    status: AgentStatus.ACTIVE,
    karma: 100,
  };

  function getParamDecoratorFactory(decorator: Function) {
    class TestClass {
      public test(@CurrentAgent() agent: Agent) {}
    }

    const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestClass, 'test');
    return args[Object.keys(args)[0]].factory;
  }

  it('should extract agent from request', () => {
    const factory = getParamDecoratorFactory(CurrentAgent);

    const mockRequest = { agent: mockAgent };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    const result = factory(null, mockContext);

    expect(result).toEqual(mockAgent);
  });

  it('should return undefined when no agent on request', () => {
    const factory = getParamDecoratorFactory(CurrentAgent);

    const mockRequest = {};
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    const result = factory(null, mockContext);

    expect(result).toBeUndefined();
  });

  it('should extract specific property when data provided', () => {
    const factory = getParamDecoratorFactory(CurrentAgent);

    const mockRequest = { agent: mockAgent };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    // Test with property selector
    const idResult = factory('id', mockContext);
    expect(idResult).toBe(mockAgent.id);

    const nameResult = factory('name', mockContext);
    expect(nameResult).toBe(mockAgent.name);
  });
});
