import numpy as np
from collections import Counter

class SimpleRatingSystem:
    def __init__(self):
        self.ratings = {}  # {item_id: [ratings]}
    
    def add_rating(self, item_id, rating, user_id=None, verified=False):
        """Add a rating to an item"""
        if item_id not in self.ratings:
            self.ratings[item_id] = []
        
        # Store rating with metadata
        rating_data = {
            'value': max(1, min(5, rating)),  # Clamp to 1-5
            'user_id': user_id,
            'verified': verified,
            'timestamp': np.datetime64('now')
        }
        self.ratings[item_id].append(rating_data)
    
    def get_average_rating(self, item_id, weighted=False):
        """Calculate average rating with optional weighting"""
        if item_id not in self.ratings or not self.ratings[item_id]:
            return 0
        
        ratings = self.ratings[item_id]
        
        if not weighted:
            return sum(r['value'] for r in ratings) / len(ratings)
        else:
            # Weight verified purchases more
            total = 0
            total_weight = 0
            for r in ratings:
                weight = 1.5 if r['verified'] else 1.0
                total += r['value'] * weight
                total_weight += weight
            return total / total_weight if total_weight > 0 else 0
    
    def get_rating_distribution(self, item_id):
        """Get count of each star rating"""
        if item_id not in self.ratings:
            return {}
        
        distribution = {i: 0 for i in range(1, 6)}
        for rating in self.ratings[item_id]:
            distribution[rating['value']] += 1
        
        return distribution
    
    def get_rating_summary(self, item_id):
        """Get complete rating summary"""
        avg = self.get_average_rating(item_id)
        weighted_avg = self.get_average_rating(item_id, weighted=True)
        dist = self.get_rating_distribution(item_id)
        total = sum(dist.values())
        
        return {
            'item_id': item_id,
            'average_rating': round(avg, 2),
            'weighted_average': round(weighted_avg, 2),
            'total_ratings': total,
            'distribution': dist,
            'percentage_5_star': (dist[5] / total * 100) if total > 0 else 0
        }


# Usage example
def demo_simple_rating():
    print("=== SIMPLE RATING SYSTEM DEMO ===")
    system = SimpleRatingSystem()
    
    # Add ratings for product 101
    system.add_rating(101, 5, user_id="user1", verified=True)
    system.add_rating(101, 4, user_id="user2", verified=True)
    system.add_rating(101, 5, user_id="user3", verified=False)
    system.add_rating(101, 1, user_id="user4", verified=False)  # Potential fake review
    system.add_rating(101, 5, user_id="user5", verified=True)
    
    # Add ratings for product 102
    system.add_rating(102, 3, user_id="user1", verified=True)
    system.add_rating(102, 3, user_id="user2", verified=True)
    
    # Get summaries
    print("\nProduct 101 Summary:")
    summary = system.get_rating_summary(101)
    for key, value in summary.items():
        print(f"  {key}: {value}")
    
    print(f"\nProduct 102 Average Rating: {system.get_average_rating(102):.2f}")