"""Test storage functions."""

import uuid
import os
import sys

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import storage

def test_storage():
    """Test storage functions."""
    print("Testing storage module...")
    
    # Create a conversation
    conv_id = str(uuid.uuid4())
    print(f"Creating conversation with ID: {conv_id}")
    
    conv = storage.create_conversation(conv_id)
    print(f"✓ Created conversation")
    print(f"  Title: {conv['title']}")
    print(f"  Created at: {conv['created_at']}")
    
    # Get conversation
    retrieved = storage.get_conversation(conv_id)
    assert retrieved is not None
    assert retrieved['id'] == conv_id
    print(f"✓ Retrieved conversation")
    
    # Update title
    new_title = "Test Conversation Title"
    success = storage.update_conversation_title(conv_id, new_title)
    assert success
    print(f"✓ Updated title to: {new_title}")
    
    # Verify update
    updated = storage.get_conversation(conv_id)
    assert updated['title'] == new_title
    print(f"✓ Verified title update")
    
    # Add user message
    user_content = "Hello, this is a test message"
    success = storage.add_user_message(conv_id, user_content)
    assert success
    print(f"✓ Added user message")
    
    # Add assistant message
    stage1 = [{"model": "test", "response": "test response"}]
    stage2 = [{"model": "test", "ranking": "test ranking"}]
    stage3 = {"model": "test", "response": "final response"}
    
    success = storage.add_assistant_message(conv_id, stage1, stage2, stage3)
    assert success
    print(f"✓ Added assistant message")
    
    # Verify messages were added
    final_conv = storage.get_conversation(conv_id)
    assert len(final_conv['messages']) == 2
    print(f"✓ Verified 2 messages in conversation")
    
    # List conversations
    conversations = storage.list_conversations()
    assert any(conv['id'] == conv_id for conv in conversations)
    print(f"✓ Conversation appears in list")
    
    # Test conversation stats
    stats = storage.get_conversation_stats()
    print(f"✓ Got conversation stats:")
    print(f"  Total conversations: {stats['total_conversations']}")
    print(f"  Total messages: {stats['total_messages']}")
    
    # Cleanup - delete conversation
    success = storage.delete_conversation(conv_id)
    assert success
    print(f"✓ Deleted test conversation")
    
    print("\n🎉 All storage tests passed!")

if __name__ == "__main__":
    test_storage()